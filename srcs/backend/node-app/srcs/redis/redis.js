import { createClient } from  'redis'
import { randomUUID } from 'crypto'
import { server } from '../server.js'
import socketCTL  from '../game/controller/websocketController.js'

//Clean function
import tournamentCTL from '../game/controller/tournamentController.js';
import lobbyCTL from '../game/controller/lobbyController.js';
import websocketCTL from '../game/controller/websocketController.js';
import matchCTL from '../game/controller/matchController.js';

const STREAM = 'events';
const GROUP = 'main';
const NAME = `main-${Math.random().toString(36).slice(2)}`

async function reportScore(matchId, player1Id, player2Id, p1, p2,) {
	const now = new Date();
	const evtId = randomUUID();

	await server.prisma.$transaction( async (tx) => {
      const envelope = {
        id: evtId,
        type: 'match.finished',
        version: 1,
        source: 'orchestrator',
        occurredAt: now.toISOString(),
        aggregate: { type: 'match', id: matchId },
        data: {
          matchId: matchId,
          tournamentId: 1,
          player1Id: player1Id,
          player2Id: player2Id,
          p1Score: p1,
          p2Score: p2,
          winnerId: p1 > p2 ? player1Id : player2Id,
          startedAt: now.toISOString(),
          endedAt: now.toISOString()
        }
      };

	  await tx.outbox.create({
		data: {
			id: evtId,
			type: envelope.type,
			aggregateId: matchId,
			occurredAt: now,
			payload: JSON.stringify(envelope)
		}
	  });
	});
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startRelay() {
	const redis = createClient({ url: process.env.REDIS_URL });
	redis.on('error', (e) => server.log.fatal(`Redis errror ${e}`));
	await redis.connect();

	const STREAM = 'events';
	for (;;) {
		const batch = await server.prisma.outbox.findMany({
			where: { publishedAt: null },
			orderBy: { occurredAt: 'asc' },
			take: 100,
		})

		if (batch.length === 0) {
			await sleep(100);
			continue
		}

		for (const row of batch) {
			try {
				await redis.xAdd(STREAM, '*', {
					type: row.type,
					aggregateId: String(row.aggregateId),
					payload: row.payload
				});

				await server.prisma.outbox.update({
					where: { id: row.id },
					data: { publishedAt: new Date() },
				});
			} catch (e) {
				server.log.error(`Relay published failed ${e}`);
			}
		}
	}
}


async function friendRequest(redis, evt) {
	const seen = await server.prisma.seenEvent.findUnique({ where: { id: evt.id } });
	if (seen) return;

	const { id, login } = evt.data;

	// LOGIC ICI
	await socketCTL.notifyUser(id, { friendRequest: { "player": login } });

	await server.prisma.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
}

async function friendStatus(redis, evt) {
	const seen = await server.prisma.seenEvent.findUnique({ where: { id: evt.id } });
	if (seen) return;

	const { login, ids, status } = evt.data;

	// LOGIC ICI
	for (const id of ids)
		await socketCTL.notifyUser(id, { friendStatus: { "status": status, "player": login } });

	await server.prisma.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
}

// BIG PROBLEM HERE => MULTIPLE DELETES AT THE SAME TIME => BUGS
async function userDeletion(redis, evt) {
	// await server.prisma.$transaction( async (tx) => {
	// 	const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
	// 	if (seen) return;

	// 	const { id } = evt.data;
		
		// LOGIC ICI                               
		// await lobbyCTL.cleanLobbies(id);
		// await tournamentCTL.cleanTournament(id);
		// await matchCTL.cleanFromMatches(id);
		// await websocketCTL.cleanWebsocket(id);

	// 	await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
	// })

	const seen = await server.prisma.seenEvent.findUnique({ where: { id: evt.id } });
	if (seen) return;

	const { id } = evt.data;

	// LOGIC ICI
	lobbyCTL.cleanLobbies(id);
	await tournamentCTL.cleanTournament(id);
	await matchCTL.cleanFromMatches(id);
	websocketCTL.cleanWebsocket(id);

	await server.prisma.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
}

async function startConsumer() {
	const redis = createClient({ url: process.env.REDIS_URL });
	redis.on('error', (e) => server.log.fatal(`Redis errror ${e}`));
	await redis.connect();

	try { await redis.xGroupCreate(STREAM, GROUP, '0', { MKSTREAM: true }); }
	catch (e) { if (!String(e?.message || '').includes('BUSYGROUP')) throw e; }

	for (;;) {
		const res = await redis.xReadGroup(GROUP, NAME, [{ key: STREAM, id: '>' }], {
			COUNT: 50,
			BLOCK: 2000, // 2s long poll
		});

		if (!res) {
			// await reclaimStuck(redis);
			continue;
		}

		for (const { messages } of res) {
			for (const msg of messages) {
				const { id, message } = msg;
				try {

					if (message.type !== 'user.deletion' && message.type !== 'friend.request' && message.type !== 'friend.status') {
						await redis.xAck(STREAM, GROUP, id);
						continue;
					}

					const evt = JSON.parse(message.payload);

					if (message.type === 'user.deletion')
						await userDeletion(redis, evt);
					else if (message.type === 'friend.request')
						await friendRequest(redis, evt);
					else if (message.type === 'friend.status')
						await friendStatus(redis, evt);

					await redis.xAck(STREAM, GROUP, id);
				} catch (e) {
					console.error('consume error', e);
					// don't ack → stays pending for retry/reclaim
				}
			}
		}
	}
}

export default { reportScore, startRelay, startConsumer }