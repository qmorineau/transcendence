// identity/verify.js
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt';
import prismaPlugin from './plugins/prisma.js';
import cookie from '@fastify/cookie';
import routes from "./routes/routes.js";
import redis from './redis/redis.js';
import nstatsFactory from 'nstats';
import prom from 'prom-client';
import oauth2 from '@fastify/oauth2';
import Fastify from 'fastify';
import pino from 'pino';
import pretty from 'pino-pretty';
import { url } from 'inspector';

const prettyStream = pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'req,res,responseTime,pid,hostname,reqId,req.host,req.remoteAddress,req.remotePort',
    singleLine: true,
    messageFormat(log, messageKey) {
        if (log.req) {
            return `Request  - ${log.req.method} - ${log.req.url}`;
        }
        if (log.res) {
            const rt =
                typeof log.responseTime === 'number'
                    ? `${log.responseTime.toFixed(2)}ms`
                    : log.responseTime;
            return `Response - ${log.res.statusCode} - ${rt}`;
        }
        return log[messageKey]; // fallback
    },
});

const logger = pino({ level: 'info' }, prettyStream);

export const server = Fastify({ loggerInstance: logger, http2: false, trustProxy: true });

server.decorate('auth', async (req, reply) => {
    try {
        await req.jwtVerify(); // fills req.user if authorized
    } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
});

server.decorate('title', async (req, reply) => {
    if (req.user.title !== 'USER')
        return reply.code(403).send({ error: "Forbidden" });
})

const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const nstats = nstatsFactory();
await server.register(nstats.fastify(), {
    ignored_routes: ['/metrics', '/health', '/api/metrics', '/api/me'],
});

//MULTIPART
await server.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });

server.register(cookie);
server.register(routes);
// OAUTH2
server.register(oauth2, {
    name: 'githubOAuth',
    scope: ['read:user', 'user:email'],
    credentials: {
        client: {
            id: process.env.GITHUB_CLIENT_ID,
            secret: process.env.GITHUB_CLIENT_SECRET
        },
        auth: {
            authorizeHost: 'https://github.com',
            authorizePath: '/login/oauth/authorize',
            tokenHost: 'https://github.com',
            tokenPath: '/login/oauth/access_token'
        }
    },
    callbackUri: process.env.GITHUB_CALLBACK_URL,
});

server.setNotFoundHandler((request, reply) => {
    reply.redirect(process.env.FRONTEND_URL);
});

await server.register(prismaPlugin);

await server.register(jwt, {
  secret: process.env.JWT_SECRET,
  // Tell fastify-jwt to read/write from the "session" cookie
  cookie: { cookieName: 'session', signed: false }
});
server.addHook('onSend', async (req, reply, payload) => {
    if (reply.statusCode >= 400) {
        try {
            let bodyStr = payload;
            if (Buffer.isBuffer(bodyStr)) bodyStr = bodyStr.toString('utf8');
            if (!bodyStr && reply.body) {
                bodyStr = typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body);
            }

            const body = bodyStr ? JSON.parse(bodyStr) : { message: 'no payload' };
            server.log.error({ url: req.url, statusCode: reply.statusCode, response: body });
        } catch (err) {
            server.log.error({ url: req.url, statusCode: reply.statusCode, response: payload ?? reply.body ?? err.message });
        }
    }
    return payload;
});

// METRICS
server.get('/metrics', async (req, reply) => {

    const prismaMetrics = await server.prisma.$metrics.prometheus();
    const appMetrics = await register.metrics();

    return reply.send(appMetrics + prismaMetrics + nstats.toPrometheus());
});

// Internal route ONLY for NGINX auth_request
server.get('/internal/auth/verify', async (req, reply) => {
    try {
        const token = req.cookies.session;
        if (!token) return reply.code(401).send({ error: "Unauthorized" });

        await req.jwtVerify();
        const payload = req.user;

        const user = await server.prisma.user.findUnique({
            where: { id: Number(payload.sub) },
            select: { id: true, login: true, title: true }
        });
        if (!user) return reply.code(401).send({ error: "Unauthorized" });

        reply.header('X-User-Id', payload.sub);
        reply.header('X-User-Login', payload.login);
        reply.header('X-User-title', (payload.title));
        reply.header('X-Auth-Method', 'jwt');
        return reply.code(200).send({ok: true}); // no body required
    } catch (e) {
        return reply.code(401).send({error: "Unauthorized", message: e.message});
    }
});

redis.startConsumer();
redis.startRelay();
server.listen({ port: 3000, host: '0.0.0.0' });
