import { request } from 'undici';
import { z } from 'zod';

const loginParamSchema = z.object({
    login: z.string().min(2).max(12).regex(/^[A-Za-z0-9_]+$/),
});

const parseLoginParam = (req, reply) => {
    const result = loginParamSchema.safeParse(req.params);
    if (!result.success) {
        reply.code(400).send({ error: 'Invalid login' });
        return null;
    }
    return result.data.login;
};

const routeErrorHandling = (handler, { message = 'Internal server error', statusCode = 500 } = {}) => {
    return async (req, reply) => {
        try {
            return await handler(req, reply);
        } catch (error) {
            req.log.error({ err: error }, 'Caught route error');
            if (reply.sent) return;

            const code = Number.isInteger(error?.statusCode) ? error.statusCode : statusCode;
            const payload = code >= 500
                ? { error: message }
                : { error: error?.message || message };

            return reply.code(code).send(payload);
        }
    };
};

const target = 'http://identity:3000/api/user/login';

const userStatsRoutes = async (fastify, options) => {

	// returns wins and losses of a user
	fastify.get('/api/stats/:login/matches/stats', { preHandler: [fastify.title] }, routeErrorHandling(async (req, reply) => {

		const targetLogin = parseLoginParam(req, reply);
		if (targetLogin === null) return;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;

		const user = await fastify.prisma.userStats.findUnique({
			where: { userId: userId },
			select: { userId: true, wins: true, losses: true },
		});
		if (!user) return reply.code(400).send({ error: "User does not exist" });

		return reply.send(user);
	}));

	// returns elo of a user
	fastify.get('/api/stats/:login/elo', { preHandler: [fastify.title] }, routeErrorHandling(async (req, reply) => {

		const targetLogin = parseLoginParam(req, reply);
		if (targetLogin === null) return;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;

		const user = await fastify.prisma.userStats.findUnique({
			where: { userId: userId },
			select: { userId:  true, elo: true },
		});
		if (!user) return reply.code(400).send({ error: "User does not exist" });

		return reply.send(user)
	}));

	// returns the ranking of all players with most elo
	fastify.get('/api/stats/ranking', { preHandler: [fastify.title] }, routeErrorHandling(async (req, reply) => {

		const limit = 10;
		const batchSize = 40;
		const ranking = [];
		let offset = 0;

		while (ranking.length < limit) {
			const batch = await fastify.prisma.userStats.findMany({
				select: { userId: true, elo: true },
				orderBy: { elo: 'desc' },
				skip: offset,
				take: batchSize,
			});

			if (batch.length === 0) break;

			const ids = batch.map(r => r.userId);
			const res = await request('http://identity:3000/internal/users/lookup', {
				method: 'POST',
				body: JSON.stringify({ ids }),
				headers: { 'content-type': 'application/json' },
			});
			if (res.statusCode >= 400) {
				fastify.log.error(`{statusCode: ${res.statusCode}}, User service error`);
				return reply.code(400).send({ error: "Failed to retrieve user profiles" });
			}

			const profiles = await res.body.json();
			const profileById = new Map(profiles.map(p => [p.id, p]));

			for (const player of batch) {
				const profile = profileById.get(player.userId);
				if (!profile || profile.title !== 'USER') continue;

				ranking.push({
					id: player.userId,
					login: profile.login,
					elo: player.elo,
				});

				if (ranking.length === limit) break;
			}

			offset += batch.length;
		}

		return reply.send(ranking);
	}));

    // returns scored and conceded stats of a user
	fastify.get('/api/stats/:login/goals', { preHandler: [fastify.title] }, routeErrorHandling(async (req, reply) => {

		const targetLogin = parseLoginParam(req, reply);
		if (targetLogin === null) return;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;

		const user = await fastify.prisma.userStats.findUnique({
			where: { userId: userId },
			select: { userId:  true, scored: true, conceded: true },
		});
		if (!user) return reply.code(400).send({ error: "User does not exist" });

		return reply.send(user)
	}));

	// returns the current and best streak of a user
	fastify.get('/api/stats/:login/streak', { preHandler: [fastify.title] }, routeErrorHandling(async (req, reply) => {

		const targetLogin = parseLoginParam(req, reply);
		if (targetLogin === null) return;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;
	
		const user = await fastify.prisma.userStats.findUnique({
			where: { userId: userId },
			select: { userId: true, streak: true, bestStreak: true },
		})
		if (!user) return reply.code(400).send({ error: "User does not exist" });

		return reply.send(user);
	}));
}

export default userStatsRoutes
