import { createClient } from 'redis';
import { server } from '../server.js'

const STREAM = 'events';
const GROUP = 'stats';
const NAME = `stats-${Math.random().toString(36).slice(2)}`

async function userStatsUpdate(redis, evt) {
    await server.prisma.$transaction(async (tx) => {
        const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
        if (seen) return; // idempotent

        const { player1Id, player2Id, p1Score, p2Score, winnerId } = evt.data;

        const p1 = await tx.userStats.upsert({
            where: { userId: player1Id },
            update: {
                scored:   { increment: p1Score },
                conceded: { increment: p2Score },
                wins:     { increment: winnerId === player1Id ? 1 : 0 },
                losses:   { increment: winnerId === player1Id ? 0 : 1 },
                streak:   (winnerId === player1Id ? { increment: 1} : 0),
            },
            create: {
                userId: player1Id, scored: p1Score, conceded: p2Score,
                wins: winnerId === player1Id ? 1 : 0,
                losses: winnerId === player1Id ? 0 : 1,
                streak: winnerId === player1Id ? 1 : 0,
            },
            select: { userId: true, elo: true, streak: true, bestStreak: true }
        });

        const p2 = await tx.userStats.upsert({
            where: { userId: player2Id },
            update: {
                scored:   { increment: p2Score },
                conceded: { increment: p1Score },
                wins:     { increment: winnerId === player2Id ? 1 : 0 },
                losses:   { increment: winnerId === player2Id ? 0 : 1 },
                streak:   (winnerId === player2Id ? { increment: 1} : 0),
            },
            create: {
                userId: player2Id, scored: p2Score, conceded: p1Score,
                wins: winnerId === player2Id ? 1 : 0,
                losses: winnerId === player2Id ? 0 : 1,
                streak: winnerId === player2Id ? 1 : 0,
            },
            select: { userId: true, elo: true, streak: true, bestStreak: true }
        });
        const winner = winnerId === p1.userId ? p1 : p2;
        const looser = winnerId === p1.userId ? p2 : p1;
        const newStreak = winner.streak > winner.bestStreak ? winner.streak : winner.bestStreak;

        const diffW = winner.elo - looser.elo;
        const probW = 1 / (1 + Math.pow(10, -diffW / 400));
        const newEloW = Math.floor(winner.elo + 32 * (1 - probW));

        const diffL = looser.elo - winner.elo;
        const probL = 1 / (1 + Math.pow(10, -diffL / 400));
        const newEloL = Math.floor(looser.elo + 32 * (0 - probL));
        
        await tx.userStats.update({
            where: { userId: winner.userId },
            data: { elo: newEloW, bestStreak: newStreak },
        });
        await tx.userStats.update({
            where: { userId: looser.userId },
            data: { elo: newEloL },
        })

        await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
    });
  
}

async function userStatsCreation(redis, evt) {
    await server.prisma.$transaction(async (tx) => {
        const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
        if (seen) return;

        const { id } = evt.data;

        const stats = await tx.userStats.create({ data: { userId: id } });

        await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
    })
}

async function userStatsDeletion(redis, evt) {
    await server.prisma.$transaction( async (tx) => {
        const seen = await tx.seenEvent.findUnique({ where: { id: evt.id } });
        if (seen) return;

        const { id } = evt.data;
        try {
            await tx.userStats.delete({ where: { userId: id } });   
        } catch (error) {
            if (error.code !== 'P2025') // Item does not exist
                server.log.error(`Failed to delete user stats for ${id}: ${error}`);
        }

        await tx.seenEvent.create({ data: { id: evt.id, seenAt: new Date() } });
    })
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

                    if (message.type !== 'match.finished' && message.type !== 'user.creation' && message.type !== 'user.deletion') {
                        await redis.xAck(STREAM, GROUP, id);
                        continue;
                    }

                    const evt = JSON.parse(message.payload);

                    if (message.type === 'match.finished')
                        await userStatsUpdate(redis, evt);
                    else if (message.type === 'user.creation')
                        await userStatsCreation(redis, evt);
                    else if (message.type === 'user.deletion')
                        await userStatsDeletion(redis, evt);

                    await redis.xAck(STREAM, GROUP, id);
                } catch (e) {
                    console.error('consume error', e);
                    // don't ack → stays pending for retry/reclaim
                }
            }
        }
    }
}

export default  { startConsumer };