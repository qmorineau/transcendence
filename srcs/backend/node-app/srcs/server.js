// Init Fastify
import {fastify} from "fastify";
import prismaPlugin from './plugins/prisma.js';
import multipart from '@fastify/multipart'
import cookie from '@fastify/cookie';
import routes from "./routes/routes.js";
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import nstatsFactory from 'nstats';
import prom from 'prom-client';
import { sockets } from "./game/controller/websocketController.js";
import redis from './redis/redis.js'
import Fastify from 'fastify';
import pino from 'pino';
import pretty from 'pino-pretty';

const Port = process.env.PORT ? Number(process.env.PORT) : 3000;
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

//METRICS => DOESNT WORK IN ROUTES ?!
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const nstats = nstatsFactory();
await server.register(nstats.fastify(), {
	ignored_routes: ['/metrics', '/health', '/healthz', '/api/metrics', '/api/me'],
});


server.setNotFoundHandler((request, reply) => {
	reply.redirect(process.env.FRONTEND_URL);
});

//MULTIPART
await server.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });

//JWT AND COOKIES
await server.register(prismaPlugin);

await server.register(cookie, { hook: 'onRequest' });

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

server.addHook('onRequest', async (req, reply) => {
	const userId = req.headers['x-user-id'];
//   if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
	if (userId) {
		req.user = {
			id: String(userId),
			login: req.headers['x-user-login'] || '',	
			title: req.headers['x-user-title'] || ''
		};
	}
});


// Tiny helper to protect routes
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

await server.register(cors, {
	origin: true,
	credentials: true
})

server.decorate("ws", async (req, reply) => {
	if (req.headers.uuid)
	{
		if (!sockets.get(req.user.id)?.get(req.cookies.session)?.get(req.headers.uuid))
			return reply.code(403).send({error: "Websocket never registered, reload the page"});
	}
	else
		return reply.code(400).send({error: "Missing UUID in the header"});
})

// Register all routes
server.register(websocket);
server.register(routes);

server.get('/health', { logLevel: 'fatal' }, async (req, reply) => {
	return reply.code(200).send({ok: true});
});

// Route for prometheus
server.get('/metrics',  {logLevel: 'silent'}, async (req, reply) => {

	const prismaMetrics = await server.prisma.$metrics.prometheus();
	const appMetrics = await register.metrics();

	return reply.send(appMetrics + prismaMetrics + nstats.toPrometheus());
});

// Route for postman
server.get('/api/metrics', async (req, reply) => {

	const prismaMetrics = await server.prisma.$metrics.prometheus();
	const appMetrics = await register.metrics();

	return reply.send(appMetrics + prismaMetrics + nstats.toPrometheus());
});

server.get('/healthz', {logLevel: 'silent'}, async () => ({ status: 'ok' }));

// Function to start
const startServer = async () => {
	try
	{
		redis.startRelay();
		redis.startConsumer();
		await server.listen({port: Port, host: "0.0.0.0"});
		// console.log(server.printRoutes());

		console.log("Server started successfully");
	}
	catch (err)
	{
		server.log.error(err);
		process.exit(1);
	}
};

// Run
startServer();