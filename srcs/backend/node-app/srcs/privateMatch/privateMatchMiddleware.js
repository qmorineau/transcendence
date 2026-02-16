import { z } from 'zod';
import { writes } from "../WriteQueue/writeQueue.js";
import { server } from "../server.js";
import { randomUUID } from 'crypto';

const MatchCreateSchema =  z.object({
    createdById: z.number().int().positive(),
    player1Id: z.number().int().positive(),
    player2Id: z.number().int().positive(),
    p1Score: z.number().int().min(0).default(0),
    p2Score: z.number().int().min(0).default(0),
    status: z.enum(["COMING_UP", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS")
});

function privateMatchDelete(matchId) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.privateMatch.delete({
                where: { id: matchId }
            })
        ]);
    });
}

async function privateMatchCreate(body) {

    const parsed = MatchCreateSchema.safeParse(body);

    if (!parsed.success) return { error: "Invalid request body" };

     const { createdById, player1Id, player2Id, p1Score, p2Score, status } = parsed.data;

     const res = await server.prisma.privateMatch.create({
        data: {
            player1Id, player2Id,
            p1Score, p2Score,
            status,
            startedAt: new Date(),
            createdById
        },
        select: { id: true, player1Id: true, player2Id: true, startedAt: true },
     });
     return res;
}

function onPrivateMatchPoint(matchId, scorer, conceder, p1Score, p2Score) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.privateMatch.update({
                where: { id: matchId },
                data: { p1Score, p2Score }
            })
        ]);
    });
}

async function onPrivateMatchUpdate(matchId, player1Id, player2Id) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.privateMatch.update({
                where: { id: matchId },
                data: { 
                    player1Id: player1Id, 
                    player2Id: player2Id 
                },
            })
        ]);
    });
}

async function onPrivateMatchEnd(matchId, winnerId, looserId) {  // update streak and elo in private matches??
    // writes.push(async () => {
    //     await server.prisma.$transaction(async (tx) => {
    //         await tx.privateMatch.update({
    //             where: { id: matchId },
    //             data: {
    //                 status: "COMPLETED",
    //                 endedAt: new Date(),
    //                 winnerId: winnerId,
    //             }

    //         }); // ===================> CREATE REDIS EVENT <===================
    //     });
    // });
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction(async (tx) => {
        const match = await tx.privateMatch.update({
            where: { id: matchId },
            data: {
                status: "COMPLETED",
                endedAt: new Date(),
                winnerId: Number(winnerId)
            },
        });

        const envelope = {
            id: evtId,
            type: 'match.finished',
            version: 1,
            source: 'main-backend',
            occurredAt: now.toISOString(),
            aggregate: { type: 'match', id: matchId },
            data: {
                player1Id: match.player1Id,
                player2Id: match.player2Id,
                p1Score: match.p1Score,
                p2Score: match.p2Score,
                winnerId: Number(winnerId)
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

export default { privateMatchCreate, privateMatchDelete, onPrivateMatchPoint, onPrivateMatchEnd, onPrivateMatchUpdate }