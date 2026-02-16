// users routes
import  user from './usersMiddleware.js';
import prom from 'prom-client';
import { request } from 'undici';

const register = new prom.Registry();
prom.collectDefaultMetrics({ register });

const target = 'http://identity:3000/api/user/login';

const userRoutes = async (fastify, options) => {
	// All routes here

	// CHECK FOR TOKEN BEARER
	fastify.get('/api/me', async (req, reply) => {
		await user.userMe(req, reply);
	});

	// returns the match (tourney & private) history of a user (ordered by last played)
	fastify.get('/api/matches/history/:login', { preHandler: [fastify.title] }, async (req, reply) => {
		const targetLogin = req.params.login;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;

		const limitParam = Number(req.query.limit ?? 50);
		const offsetParam = Number(req.query.offset ?? 0);
		const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50, 200);
		const offset = Math.max(Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0, 0);

		const [tournamentMatches, privateMatches] = await Promise.all([
			fastify.prisma.match.findMany({
				where: {
					status: "COMPLETED",
					OR: [
						{ player1Id: userId },
						{ player2Id: userId },
					],
				},
				select: {
					p1Score: true,
					p2Score: true,
					endedAt: true,
					player1Id: true,
					player2Id: true,
					player1Alias: true,
					player2Alias: true,
				},
			}),
			fastify.prisma.privateMatch.findMany({
				where: {
					status: "COMPLETED",
					OR: [{ player1Id: userId }, { player2Id: userId }],
				},
				select: {
					p1Score: true,
					p2Score: true,
					endedAt: true,
					player1Id: true,
					player2Id: true,
				},
			}),
		]);

		const participantIds = new Set();
		for (const match of tournamentMatches) {
			if (typeof match.player1Id === 'number') participantIds.add(match.player1Id);
			if (typeof match.player2Id === 'number') participantIds.add(match.player2Id);
		}
		for (const match of privateMatches) {
			if (typeof match.player1Id === 'number') participantIds.add(match.player1Id);
			if (typeof match.player2Id === 'number') participantIds.add(match.player2Id);
		}

		let profiles = [];
		if (participantIds.size > 0) {
			let res;
			try {
				res = await request('http://identity:3000/internal/users/lookup', {
					method: 'POST',
					body: JSON.stringify({ ids: Array.from(participantIds) }),
					headers: { 'content-type': 'application/json' },
					headersTimeout: 5000,
					bodyTimeout: 5000,
				});
			} catch (error) {
				fastify.log.error({ err: error }, 'Identity service network issue');
				return reply.code(502).send({ error: "Failed to reach User service" });
			}
			if (res.statusCode >= 400) {
				fastify.log.error(`{statusCode: ${res.statusCode}}, User service error`);
				return reply.code(502).send({ error: "Failed to retrieve user profiles" });
			}
			profiles = await res.body.json();
		}

		const loginById = new Map(profiles.map(profile => [profile.id, profile.login]));
		loginById.set(userId, targetLogin);

		const getLogin = (id) => (typeof id === 'number' ? loginById.get(id) ?? null : null);

		const normalizeTournament = (m) => {
			const isP1 = userId === m.player1Id;
			const opponentId = isP1 ? m.player2Id : m.player1Id;
			const myScore = isP1 ? m.p1Score : m.p2Score;
			const oppScore = isP1 ? m.p2Score : m.p1Score;

			return {
				type: "tournament",
				endedAt: m.endedAt,
				me: targetLogin,
				opponent: getLogin(opponentId),
				myScore,
				opponentScore: oppScore,
				player1: getLogin(m.player1Id),
				player2: getLogin(m.player2Id),
				player1Alias: m.player1Alias,
				player2Alias: m.player2Alias,
				p1Score: m.p1Score,
				p2Score: m.p2Score,
			};
		};

		const normalizePrivate = (m) => {
			const isP1 = userId === m.player1Id;
			const opponentId = isP1 ? m.player2Id : m.player1Id;
			const myScore = isP1 ? m.p1Score : m.p2Score;
			const oppScore = isP1 ? m.p2Score : m.p1Score;

			return {
				type: "private",
				endedAt: m.endedAt,
				me: targetLogin,
				opponent: getLogin(opponentId),
				myScore,
				opponentScore: oppScore,
				player1: getLogin(m.player1Id),
				player2: getLogin(m.player2Id),
				p1Score: m.p1Score,
				p2Score: m.p2Score,
			};
		};

		const unified = [
			...tournamentMatches.map(normalizeTournament),
			...privateMatches.map(normalizePrivate),
		]
		.sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));

		const paged = unified.slice(offset, offset + limit);

		return reply.send({
			total: unified.length,
			limit,
			offset,
			items: paged,
		});
	});

	// CALCULATE THE TIME A USER HAS SPENT PLAYING
	fastify.get('/api/matches/played/:login', { preHandler: [fastify.title] }, async (req, reply) => {

		const targetLogin = req.params.login;

		const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
		if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
		const data = await body.json();
		const userId = data.id;

		const sumDurationMs = (rows) => rows.reduce((acc, m) => {
			const start = m.startedAt && new Date(m.startedAt).getTime();
			const end = m.endedAt 	  && new Date(m.endedAt).getTime();
			const diff = (end ?? 0) - (start ?? 0);
			return acc + (diff > 0 ? diff : 0);
		}, 0);

		const [tournamentMatches, privateMatches] = await Promise.all([
			fastify.prisma.match.findMany({
				where: { 
					status: "COMPLETED",
					OR: [
						{ player1Id: userId },
						{ player2Id: userId },
					],
				},
				select: { startedAt: true, endedAt: true },
			}),
			fastify.prisma.privateMatch.findMany({
				where: {
					status: "COMPLETED",
					OR: [{ player1Id: userId }, { player2Id: userId }],
				},
				select: { startedAt: true, endedAt: true },
			}),
		]);

		const tourMs = sumDurationMs(tournamentMatches);
		const privMs = sumDurationMs(privateMatches);
		const totalMs = tourMs + privMs;


		const totalSec = Math.floor(totalMs / 1000);
		const hours = Math.floor(totalSec / 3600);
		const minutes = Math.floor((totalSec % 3600) / 60);
		const seconds = totalSec % 60;
		const formatted = `${hours}h ${minutes}m ${seconds}s`;

		return reply.code(200).send({
			userId: userId,
			matchesCount: tournamentMatches.length + privateMatches.length,
			tournament: {
				matches: tournamentMatches.length,
			},
			private: {
				matches: privateMatches.length,
			},
			duration: formatted,
		});
	});
}

export default userRoutes;
