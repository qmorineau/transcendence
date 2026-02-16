import { createClient } from 'redis';
import { server } from '../server.js'
import { randomUUID } from 'crypto';

const STREAM = 'events';
const GROUP = 'users';
const NAME = `users-${Math.random().toString(36).slice(2)}`


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
                    if (message.type !== 'user.status') {
                        await redis.xAck(STREAM, GROUP, id);
                        continue;
                    }
                    const evt = JSON.parse(message.payload);

                    await server.prisma.$transaction(async (tx) => {
                        const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
                        if (seen) return;

                        const { login, id, status } = evt.data;
                        const user = await tx.user.update({
                            where: { login: login },
                            data: { status: status },
                            select: { id: true, title: true, login: true}
                        });

                        if (user.title === "GUEST" && status === "OFFLINE") {
                            try {
                                await tx.user.delete({ where: { id: user.id } });
                                onUserDeletion(user.id);
                            } catch (e) {
                                server.log.error(`Failed to delete guest user ${login}: ${e}`);
                            }
                        }


                        await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
                    });

                    await redis.xAck(STREAM, GROUP, id);
                } catch (e) {
                    server.log.error('consume error', e);
                    // don't ack → stays pending for retry/reclaim
                }
            }
        }
    }
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

async function onUserCreation(userId) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction( async (tx) => {
        const envelope = {
            id: evtId,
            type: 'user.creation',
            version: 1,
            source: 'identity',
            occurredAt: now.toISOString(),
            aggregate: { type: 'user', id: userId },
            data: {
                id: userId
            }
        };

        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: userId,
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    });
}

async function onUserDeletion(userId) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction( async (tx) => {
        const envelope = {
            id: evtId,
            type: 'user.deletion',
            version: 1,
            source: 'identity',
            occurredAt: now.toISOString(),
            aggregate: { type: 'user', id: userId },
            data: {
                id: userId
            }
        };

        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: userId,
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    })
}

export default { startConsumer, startRelay, onUserCreation, onUserDeletion }