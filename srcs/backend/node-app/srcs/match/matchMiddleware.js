import { z } from 'zod'
import { writes } from "../WriteQueue/writeQueue.js"
import { server } from "../server.js"
import { randomUUID } from 'crypto';
import { on } from 'events';

const TourneyMatchCreateSchema = z.object({
    tournamentId: z.number().int().positive(),
    player1Id: z.number().int().positive(),
    player2Id: z.number().int().positive(),
    player1Alias: z.string().min(3).max(24),
    player2Alias: z.string().min(3).max(24),
    p1Score: z.number().int().min(0).default(0),
    p2Score: z.number().int().min(0).default(0),
    status: z.enum(["COMING_UP", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
});

async function matchCreate(body) {
    const parsed = TourneyMatchCreateSchema.safeParse(body);

    if (!parsed.success) return { error: "Invalid request body", body: body };

    const { tournamentId, player1Id, player2Id, player1Alias, player2Alias, p1Score, p2Score, status } = parsed.data;
    if (player1Id === player2Id) return { error: "Must not be the 2 same players"};

    // CHECK IF PLAYERS EXIST
    try {
        const match = await server.prisma.match.create({
            data: {
                tournamentId,
                player1Id,
                player2Id,
                p1Score, p2Score, player1Alias, player2Alias,
                status,
                startedAt: new Date()
            },
            select: { id: true, tournamentId: true, p1Score: true, p2Score: true, status: true, startedAt: true },
        })
        return match;
    } catch (e) {
        if (e.code === 'P2003') { // ERROR CODE OF FOREIGN KEY VIOLATION
            // return reply.code(409).send({ error: "Tournament not found" });
            return JSON.stringify({ error: "Tournament or player not found" });
        }
        req.log.error(e);
        return JSON.stringify({ error: "Error creating the match" });
    }
}

async function onPoint(matchId, p1Score, p2Score) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.match.update({
                where: { id: matchId },
                data: { p1Score: p1Score, p2Score: p2Score },
            })
        ]);
    });
}

async function onMatchUpdate(matchId, player1Id, player2Id, player1Alias, player2Alias) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.match.update({
                where: { id: matchId },
                data: { 
                    player1Id: player1Id, player1Alias: player1Alias,
                    player2Id: player2Id, player2Alias: player2Alias
                },
            })
        ]);
    });
}

async function onMatchEnd(matchId, winnerId) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction(async (tx) => {
        const match = await tx.match.update({
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

export default { matchCreate, onPoint, onMatchEnd, onMatchUpdate };