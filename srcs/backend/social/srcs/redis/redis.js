import { createClient } from 'redis';
import { server } from '../server.js'
import { randomUUID } from 'crypto';
import { request } from 'undici';

const STREAM = 'events';
const GROUP = 'social';
const NAME = `social-${Math.random().toString(36).slice(2)}`

async function friendDeletion(redis, evt) {
    server.log.warn("friend deletion event");
    await server.prisma.$transaction( async (tx) => {
        const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
        if (seen) return;

        const { id } = evt.data;

        await tx.friendship.deleteMany({
            where: {
                OR: [{ requesterId: id}, { receiverId: id }],
            },
        });

        await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
    })
}

async function notifyForFriendStatusChange(login, id, status) {
    const now = new Date();
    const evtId = randomUUID();

    const edges = await server.prisma.friendship.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [{ requesterId: Number(id) }, { receiverId: Number(id) }],
        },
        select: { requesterId: true, receiverId: true },
    });

    const friendIds = Array.from(
        new Set(edges.map(e => (e.requesterId === Number(id) ? e.receiverId : e.requesterId)))
    );

    if (friendIds.length === 0) return;


   await server.prisma.$transaction(async (tx) => {
       const envelope = {
           id: evtId,
           type: 'friend.status',
           version: 1,
           source: 'social',
           occurredAt: now.toISOString(),
           aggregate: { type: 'friendship', id: Number(id) },
            data: {
                login: login,
                ids: friendIds,
                status: status
            }
        };

        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: Number(id),
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    })

}

async function statusChange(redis, evt) {
    const seen = await server.prisma.seenEvent.findUnique({ where: { id: evt.id } });
    if (seen) return;

    const { login, id, status } = evt.data;

    // LOGIC ICI
    await notifyForFriendStatusChange(login, id, status);

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

                    if (message.type !== 'user.deletion' && message.type !== 'user.status') {
                        await redis.xAck(STREAM, GROUP, id);
                        continue;
                    }

                    const evt = JSON.parse(message.payload);

                    if (message.type === 'user.deletion')
                        await friendDeletion(redis, evt);
                    else if (message.type === 'user.status')
                        await statusChange(redis, evt);

                    await redis.xAck(STREAM, GROUP, id);
                } catch (e) {
                    console.error('consume error', e);
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

async function onFriendRequestSent(targetId, senderLogin) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction( async (tx) => {
        const envelope = {
            id: evtId,
            type: 'friend.request',
            version: 1,
            source: 'social',
            occurredAt: now.toISOString(),
            aggregate: { type: 'friendship', id: targetId },
            data: {
                id: targetId,
                login: senderLogin
            }
        };

        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: targetId,
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    })
}

export default  { startConsumer, startRelay, onFriendRequestSent };