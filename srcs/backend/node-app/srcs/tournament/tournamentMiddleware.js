import { z } from 'zod';
import { writes } from "../WriteQueue/writeQueue.js"
import { server } from "../server.js"

const TournamentDeleteSchema = z.object({
    id: z.number().int().positive(),
});

// Create a tournament and create the player for the user that created the tourney
async function tournamentCreate() {
    const tourney = await server.prisma.tournament.create({
        data: {
            createdAt: new Date(),
        },
        select: { id: true, status: true, createdAt: true},
    });

    return tourney;
}

async function tournamentDelete(body) {
    const parsed = TournamentDeleteSchema.safeParse(body);

    if (!parsed.success) return { error: "Invalid request body" };

    const { id } = parsed.data;
    try {
        const tourney = server.prisma.tournament.delete({
            where: { id: id },
            select: { id: true },
        });
        return tourney;
    } catch (error) {
        if (error.code === 'P2025') // Item does not exist
            return { error: "Recordd to delete does not exist"};
        else
            return { error: error.message };
    }
}

function onTournamentEnd(tournamentId, winnerId) {
    writes.push(async () => {
        await server.prisma.$transaction([
            server.prisma.tournament.update({
                where: { id: tournamentId },
                data: { endedAt: new Date(), winnerId: Number(winnerId), status: "COMPLETED" },
            })
        ]);
    });
}

export default { tournamentCreate, tournamentDelete, onTournamentEnd };