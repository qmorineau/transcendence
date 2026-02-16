import { z } from 'zod';
import { request } from 'undici';
import redis from '../redis/redis.js';

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

const STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    BLOCKED: 'BLOCKED',
};
const allowedStatus = new Set(Object.values(STATUS));

const loginSchema = z.object({
    login: z.string().min(6, 'Login must be at least 6 characters long').max(12, 'Login must be at most 12 characters long').regex(/^[A-Za-z0-9_]+$/i, 'Login must only contain alpha-numerical characters and underscores'),
});

async function findEitherDirection(fastify,aId, bId) {
    return await fastify.prisma.friendship.findFirst({
        where: {
            OR: [
                { requesterId: aId, receiverId: bId },
                { requesterId: bId, receiverId: aId },            
            ]
        }
    });
}
const target = 'http://identity:3000/api/user/login';

const friendshipRoutes = async (fastify, options) => {
    fastify.get('/api/friends/help', async (req, reply) => {
        return reply.send({ ok: true });
    })
    
    // SEND FRIEND REQUEST
    fastify.post('/api/friends/request', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const requesterId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
        const data = await body.json();
        const receiverId = data.id;

        if (requesterId === receiverId) return reply.code(400).send({ error: "Cant friend yourself"});

        const existing = await findEitherDirection(fastify, requesterId, receiverId);
        if (existing) {
            if (existing.status === STATUS.PENDING)
                return reply.code(400).send({ error: "Request is in pending state"});
            if (existing.status === STATUS.ACCEPTED)
                return reply.code(400).send({ error: "Already friends"});
            if (existing.status === STATUS.BLOCKED)
                return reply.code(400).send({ error: "This person blocked you"});
        }

        const created = await fastify.prisma.friendship.create({
            data: { requesterId, receiverId, status: STATUS.PENDING },
        });

        // Notify the other service that a friend request has been sent
        redis.onFriendRequestSent(receiverId, req.user.login);

        return reply.code(201).send(created);
    }));

    // ACCEPT FRIEND REQUEST
    fastify.post('/api/friends/accept', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const userId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(400).send({ error: "User does not exist" });
        const targetUser = await body.json();

        const friendship = await findEitherDirection(fastify, userId, targetUser.id);
        if (!friendship) return reply.code(404).send({ error: "Friend request does not exist"});

        if (friendship.status !== STATUS.PENDING) return reply.code(400).send({ error: "Not an active friend request"});
        if (friendship.receiverId !== userId) return reply.code(403).send({ error: "Only the receiver can accept the request"});

        const updated = await fastify.prisma.friendship.update({
            where: { id: friendship.id },
            data: { status: STATUS.ACCEPTED },
        });

        return reply.send(updated);
    }));

    // DECLINE A PENDING FRIEND REQUEST
    fastify.delete('/api/friends/pending', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const userId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(404).send({ error: "User does not exist" });
        const targetUser = await body.json();

        const friendship = await findEitherDirection(fastify, userId, targetUser.id);
        if (!friendship) return reply.code(400).send({ error: "Friend request does not exist" });

        if (friendship.status !== STATUS.PENDING) return reply.code(400).send({ error: "Not an active friend request" });
        try {
            await fastify.prisma.friendship.delete({ where: { id: friendship.id } });
            return reply.code(204).send();
        } catch (error) {
            if (error.code === 'P2025') // Item does not exist
                return reply.code(404).send({ error: "Record to delete does not exist" });
            else
                return reply.code(410).send({ error: error.message });
        }
    }));

    // BLOCK A USER FRIEND OR NOT
    fastify.post('/api/friends/block', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const userId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(404).send({ error: "User does not exist" });
        const targetUser = await body.json();
        
        if (userId === targetUser.id) return reply.code(400).send({ error: "Can't block yourself"});

        const existing = await findEitherDirection(fastify, userId, targetUser.id);
        if (existing) {
            const updated = await fastify.prisma.friendship.update({
                where: { id: existing.id },
                data: { status: STATUS.BLOCKED },
            });
            return reply.send(updated);
        } else {
            const created = await fastify.prisma.friendship.create({
                data: { requesterId: userId, receiverId: targetUser.id, status: STATUS.BLOCKED },
            });
            return reply.code(201).send(created);
        }
    }));

    // UNFRIEND (BOTH SIDES CAN) WHEN ACCEPTED
    fastify.delete('/api/friends/unfriend', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const userId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(404).send({ error: "User does not exist" });
        const targetUser = await body.json();
        
        if (userId === targetUser.id) return reply.code(400).send({ error: "Can't block yourself"});

        const existing = await findEitherDirection(fastify, userId, targetUser.id);
        if (!existing) return reply.code(404).send({ error: "Can't unfriend a non-friend"});
        if (existing.status !== STATUS.ACCEPTED) return reply.code(400).send({ error: "Can't unfriend a non-friend"});
        try {
            await fastify.prisma.friendship.delete({ where: { id: existing.id } });
            return reply.code(204).send() // CANT SEND A BODY WITH 204
        } catch (error) {
            if (error.code === 'P2025') // Item does not exist
                return reply.code(404).send({ error: "Record to delete does not exist" });
            else
                return reply.code(410).send({ error: error.message });
        }
    }));

    // LIST FRIENDS (sorted by login)
    fastify.get('/api/friends/list', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const userId = Number(req.user.id);

        const edges = await fastify.prisma.friendship.findMany({
            where: {
                status: STATUS.ACCEPTED,
                OR: [{ requesterId: userId }, { receiverId: userId }],
            },
            select: { requesterId: true, receiverId: true },
        });

        const friendIds = Array.from(
            new Set(edges.map(e => (e.requesterId === userId ? e.receiverId : e.requesterId)))
        );

        if (friendIds.length === 0) return reply.send([]);

        let res;
        try {
            res = await request('http://identity:3000/internal/users/lookup', {
                method: 'POST',
                body: JSON.stringify({ ids: friendIds }),
                headers: { 'content-type': 'application/json' },
                headersTimeout: 5000,
                bodyTimeout: 5000,
            });
        } catch (error) {
            fastify.log.error(`{${error}}, Identity network issue`);
            return reply.code(502).send({ error: "Failed to reach User service" });
        }
        if (res.statusCode >= 400) {
            fastify.log.error(`{statusCode: ${res.statusCode}}, User service error`);
            return reply.code(502).send({ error: "Failed to retrieve user profiles" });
        }

        const profiles = await res.body.json();

        const loginById = new Map(profiles.map(p => [p.id, p.login]));
        const friends = friendIds
            .map(id => ({ id, login: loginById.get(id) }))
            .filter(x => typeof x.login === 'string' && x.login.length > 0)
            .sort((a, b) => a.login.localeCompare(b.login, undefined, { sensitivity: 'base' }));

        return reply.send(friends);
    }));

    // LIST INCOMING FRIEND REQUEST
    fastify.get('/api/friends/incoming', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const userId = Number(req.user.id);
        const requests = await fastify.prisma.friendship.findMany({
            where: { receiverId: userId, status: STATUS.PENDING },
            select: {
                id: true, requesterId: true, createdAt: true
            },
            orderBy: { createdAt: 'desc' },
        });
        
        const requesterIds = requests.map(r => r.requesterId);
        if (requesterIds.length === 0) return reply.send([]);

        const res = await request('http://identity:3000/internal/users/lookup', {
            method: 'POST',
            body: JSON.stringify({ ids: requesterIds }),
            headers: { 'content-type': 'application/json' },
        });
        if (res.statusCode >= 400) {
            fastify.log.error(`{statusCode: ${res.statusCode}}, User service error`);
            return reply.code(502).send({ error: "Failed to retrieve user profiles" });
        }

        const profiles = await res.body.json();

        const loginById = new Map(profiles.map(p => [p.id, p.login]));

        const list = requests.map(r => ({
            id: r.id,
            requesterId: r.requesterId,
            createdAt: r.createdAt,
            requester: { id: r.requesterId, login: loginById.get(r.requesterId) },
        }));

        return reply.send(list);
    }));

    // LIST OUTGOING FRIEND REQUEST
    fastify.get('/api/friends/outgoing', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {
        const userId = Number(req.user.id);
        const requests = await fastify.prisma.friendship.findMany({
            where: { requesterId: userId, status: STATUS.PENDING },
            select: {
                id: true, receiverId: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const receiverIds = requests.map(r => r.receiverId);
        if (receiverIds.length === 0) return reply.send([]);

        const res = await request('http://identity:3000/internal/users/lookup', {
            method: 'POST',
            body: JSON.stringify({ ids: receiverIds }),
            headers: { 'content-type': 'application/json' },
        });
        if (res.statusCode >= 400) {
            fastify.log.error(`{statusCode: ${res.statusCode}}, User service error`);
            return reply.code(502).send({ error: "Failed to retrieve user profiles" });           
        }

        const profiles = await res.body.json();

        const loginById = new Map(profiles.map(p => [p.id, p.login]));

        const list = requests.map(r=> ({
            id: r.id,
            receiverId: r.receiverId,
            createdAt: r.createdAt,
            receiver: { id: r.receiverId, login: loginById.get(r.receiverId)},
        }));

        return reply.send(list);
    }));

    // Route to know friend status with a user
    fastify.post('/api/friends/status', { preHandler: [fastify.title ]} ,routeErrorHandling(async (req, reply) => {

        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ status: false });

        const userId = Number(req.user.id);
        const targetLogin = parsed.data.login;

        const { body, statusCode } = await request(`${target}/${targetLogin}`, { method: 'GET' });
        if (statusCode >= 400) return reply.code(400).send({ status: false });
        const targetUser = await body.json();
        fastify.log.error(targetUser)
        
        if (userId === targetUser.id) return reply.code(400).send({ status: false });

        const existing = await findEitherDirection(fastify, userId, targetUser.id);
        if (!existing) return reply.code(400).send({ status: false });

        return reply.code(200).send({ status: existing.status });
    }));
}

export default friendshipRoutes;