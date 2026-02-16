import undici from "undici";
import { z } from 'zod'
import nstatsFactory from 'nstats';
import prom from 'prom-client';
import Fastify from 'fastify';
import pino from 'pino';
import pretty from 'pino-pretty';

const unregisterSchema = z.object({
	gameId: z.number().int().positive(),
	type: z.enum(["tournament", "private"])
});

const registerSchema = z.object({
	gameId: z.number().int().positive(),
	side: z.enum(["left", "right"]),
	paddleX: z.number().int(),
	type: z.enum(["tournament", "private"])
})

const decideSchema = z.object({
	gameId: z.number().int().positive(),
	type: z.enum(["tournament", "private"])
});

const { Client } = undici;

const Port = Number(process.env.PORT ?? 3000);
const POLL_INTERVAL = 1000;
const FIELD_HEIGHT = 10;
const FIELD_WIDTH = 18;
const FRAMERATE = 10;
const PADDLE_WIDTH = 1.75;
const DEADZONE = 1.5 / 2;
const PADDLE_SPEED = 0.1; // per frame

const upstream = new Client("http://app:3000", {
});

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

//METRICS
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const nstats = nstatsFactory();
await server.register(nstats.fastify(), {
	ignored_routes: ['/metrics', '/health', '/api/metrics', '/api/me'],
});

const games = new Map();
/*
	games =
		gameId -> {
			side: "left"/"right",
			paddleX = number,
			timer = ....
			// snapshots
			prev = { time , ball}
			last = { time, ball, aipaddle }
			lastPollError = String
		}
*/


// ========================  FUNCTIONS  ===========================

function startTimerPerGame(gameId, type) {
	const tmp = games.get(gameId);
	if (!tmp) return;
	const existing = tmp.get(type);
	if (!existing) return;

	if (existing?.timer) clearInterval(existing.timer);

	const timer = setInterval(() => pollOneUpdate(gameId, type), POLL_INTERVAL);
	timer.unref?.();  // Server doesnt block just because this timer is left alive
	const g = games.get(gameId).get(type);
	if (g)
		g.timer = timer;
}

async function pollOneUpdate(gameId, type) {
	const tmp = games.get(gameId);
	if (!tmp) {
		return;
	}
	const g = tmp.get(type);
	if (!g) {
		return;
	}
	try {
		const { statusCode, body } = await upstream.request({
			method: "POST",
			path: "/internal/gameUpdate",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ gameId: gameId, type: type }),
		});
		const text = await body.text();
		if (statusCode < 200 || statusCode >= 300) {
			return;
		}

		let payload;
		try { payload = JSON.parse(text); } catch { payload = {}; }

		if (!payload || payload.gameId !== gameId || !payload.ball || !payload.aiPaddle) {
			return;
		}

		//update snapshots
		g.prev = g.last ? { time: g.last.time, ball: { ...g.last.ball }, aiPaddle: { ...g.last.aiPaddle } } : undefined;
		g.last = {
			time: new Date(),
			ball: { x: Number(payload.ball.x), y: Number(payload.ball.y), vx: Number(payload.ball.vx), vy: Number(payload.ball.vy), speed: Number(payload.ball.speed) },
			aiPaddle: { x: Number(payload.aiPaddle.x), y: Number(payload.aiPaddle.y) },
		};

	} catch (error) {
		const msg = (error && error.message) ? error.message : String(error);
		const g2 = games.get(gameId);
	}
}

function triangleReflection0toL(val, L) {  // triangle wave reflection (bounce on walls)
	const period = 2 * L;
	let m = val % period;
	if (m < 0) m += period;
	return m <= L ? m : period - m;
}

function triangleReflectionCentered(y, H) {
	const u = y + H / 2;
	const fold = triangleReflection0toL(u, H);
	return fold - H / 2;
}

function predictY(startY, vy, horizon, field_height) {
	const linearY = startY + vy * horizon;
	return triangleReflectionCentered(linearY, field_height);
}

function getRandomInt(min, max) {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function randn_bm(min, max, skew) {
	let u = 0, v = 0;
	while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
	while (v === 0) v = Math.random()
	let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

	num = num / 10.0 + 0.5 // Translate to 0 -> 1
	if (num > 1 || num < 0)
		num = randn_bm(min, max, skew) // resample between 0 and 1 if out of range

	else {
		num = Math.pow(num, skew) // Skew
		num *= max - min // Stretch to fill range
		num += min // offset to min
	}
	return num
  }

async function decideFromPrediction(gameId, g, type) {
	if (g.tick == 1) {
		g.tick = 0;
		return;
	}

	const last = g.last;
	if (!last || !last.ball) {
		return { move: "up" } ///////////////////////////////////////////
	}

	const now = new Date();
	const elapsedS = Math.max(0, (now - last.time) / 1000);
	const ballNowX = last.ball.x + (last.ball.vx / 10 * last.ball.speed * elapsedS);
	const ballNowY = predictY(last.ball.y, (last.ball.vy + randn_bm(-1, 1, 1))* last.ball.speed / 10, elapsedS, FIELD_HEIGHT) + randn_bm(-1, 1, 1);  // WHERE IS THE BALL NOW

	const side = g.side;
	const paddleX = g.paddleX;

	let dtToX = null;
	const dt = (paddleX - ballNowX) / (last.ball.vx * last.ball.speed / 10);
	if (dt > 0) dtToX = dt;                                   // TIME TO REACH AI PADDLE


	let targetY, predictedAtMs = null;             // Y POS OF THE BALL AT THE AI PADDLE X POS
	if (dtToX == null) {
		targetY = 0;
	} else {
		targetY = predictY(ballNowY, last.ball.vy * last.ball.speed / 10, dtToX, FIELD_HEIGHT);
		predictedAtMs = now + dtToX * 1000;
	}

	const dy = targetY - last.aiPaddle.y;

	if (dy > DEADZONE) {
		g.last.aiPaddle.y += PADDLE_SPEED;
		await upstream.request({
			method: "POST",
			path: "/internal/moveAI",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: gameId, move: "up", type: type, targetY: targetY, predictedAt: predictedAtMs, decision: "chase_up" }),
		});
		// server.log.error({paddleY: g.last.aiPaddle.y});
		// server.log.error({ id: gameId, move: "up", targetY: targetY, predictedAt: predictedAtMs, decision: "chase_up" })
			g.tick = 1;
		return { ok: true };
	}
	if (dy < -DEADZONE) {
		g.last.aiPaddle.y -= PADDLE_SPEED;
		await upstream.request({
			method: "POST",
			path: "/internal/moveAI",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: gameId, move: "down", type: type, targetY: targetY, predictedAt: predictedAtMs, decision: "chase_down" }),
		});
		// server.log.error({paddleY: g.last.aiPaddle.y});
		// server.log.error({ id: gameId, move: "down", targetY: targetY, predictedAt: predictedAtMs, decision: "chase_down" })
		g.tick = 1;

		return { ok: true };
	}
	return { ok: true };
};


///////////////////
// Quand la game demarre avoir la direction de la balle sinon goal automatique pour le juerur car l'ia n'a pas le temps de reagir
////////////////////


// ========================  ROUTES  ==============================
// REGISTER A GAME TO THE IA 
server.post('/internal/register', async (req, reply) => {

	const parsed = registerSchema.safeParse(req.body);
	if (!parsed.success) {
		return reply.code(401).send({ error: "Invalid request body" });
	}

	const { gameId, side, paddleX, type } = parsed.data;

	if (games.has(gameId) && games.get(gameId).has(type)) {
		server.log.error(`Game with id ${gameId} and type ${type} already registered`);
		return reply.code(402).send({ error: `Game with id ${gameId} and type ${type} already registered` });
	}

	if (!games.has(gameId))
		games.set(gameId, new Map());

	const game = games.get(gameId);
	game.set(type, {
		tick: 0,
		side: side,
		paddleX: paddleX
	});

	// register the game and start timer to poll once per second
	await pollOneUpdate(gameId, type);
	startTimerPerGame(gameId, type);

	return reply.send({ ok: true });
});


// UNREGISTER A GAME FROM THE IA
server.post('/internal/unregister', async (req, reply) => {
	const parsed = unregisterSchema.safeParse(req.body);

	if (!parsed.success) return reply.code(400).send({ error: "Invalid request body " });

	const { gameId, type } = parsed.data;

	const tmp = games.get(gameId);
	if (!tmp) return reply.code(401).send({ error: `No game registered with this id: ${gameId}` });

	const game = tmp.get(type);
	if (!game) return reply.code(402).send({ error: `No game registered with this id and type: ${gameId} ${type}` });
	
	if (game?.timer) clearInterval(game.timer); // Clear the timer that polls once per second for this game

	tmp.delete(type);
	if (tmp.size === 0)
		games.delete(gameId);


	return reply.send({ ok: true });
});

// ASKS A MOVE FROM THE AI FOR A GAME
server.post('/internal/decide', { logLevel: 'silent' }, async (req, reply) => {

	const parsed = decideSchema.safeParse(req.body);
	if (!parsed.success) {
		return reply.code(401).send({ error: "Invalid request body" });
	}

	const { gameId, type } = parsed.data;
	const tmp = games.get(gameId);
	if (!tmp) {
		return reply.code(402).send({ error: `No game registered with this id: ${gameId}` });
	}
	const game = tmp.get(type);
	if (!game) {
		return reply.code(403).send({ error: `No game registered with this id and type: ${gameId} ${type}` });
	}

	const { move } = decideFromPrediction(gameId, game, type);

	return reply.send({ ok: true });
});





// ==========================  MAIN  ===========================
async function callBackend() {
	const { statusCode, body } = await upstream.request({
		method: "GET",
		path: "/internal",
	});
	const text = await body.text();
	if (statusCode < 200 || statusCode >= 300) {
		return (`upstream ${statusCode}: ${text}`);
	}
	try { return JSON.parse(text); } catch { return { raw: text }; }
}

// Metrics route
server.get('/metrics', { logLevel: 'silent' }, async (req, reply) => {

	const appMetrics = await register.metrics();

	return reply.send(appMetrics + nstats.toPrometheus());
});

async function startServer() {
	try {
		await server.listen({ port: Port, host: "0.0.0.0" });
		console.log("IA Server Started");
		const data = await callBackend();
		console.log("warmup: ", data);
	} catch (error) {
		server.log.error(error);
		process.exit(1);
	}
}

startServer();