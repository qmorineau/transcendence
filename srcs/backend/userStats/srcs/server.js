import prismaPlugin from './plugins/prisma.js';
import routes from "./routes/routes.js";
import redis from './redis/redis.js'
import nstatsFactory from 'nstats';
import prom from 'prom-client';
import Fastify from 'fastify';
import pino from 'pino';
import pretty from 'pino-pretty';


const Port = 3000;

function ownMethods(obj) {
    return Reflect.ownKeys(obj).filter((k) => {
        const d = Object.getOwnPropertyDescriptor(obj, k);
        return d;
    });
  }

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

server.setNotFoundHandler((request, reply) => {
    reply.redirect(process.env.FRONTEND_URL);
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

await server.register(prismaPlugin);

server.register(routes);

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
  req.user = {
    id: String(userId),
    login: req.headers['x-user-login'] || '',
    title: req.headers['x-user-title'] || ''
  };
});


server.get('/health', async (req, reply) => { return reply.send({ok: true}) })
server.get('/api/dev/test', async (req, reply) => {
    return reply.send({ok: true});
})

server.get('/metrics',  {logLevel: 'silent'}, async (req, reply) => {

    const prismaMetrics = await server.prisma.$metrics.prometheus();
    const appMetrics = await register.metrics();

    return reply.send(appMetrics + prismaMetrics + nstats.toPrometheus());
});

const startServer = async () => {
    try
    {
        await server.listen({port: Port, host: "0.0.0.0"});
        redis.startConsumer();
        console.log("dev started successfully");
    }
    catch (err)
    {
        server.log.error(err);
        process.exit(1);
    }
};

startServer();