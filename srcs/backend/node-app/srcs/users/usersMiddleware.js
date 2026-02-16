import { server } from "../server.js"
import { randomUUID } from 'crypto';


async function userMe(req, reply) {
    return reply.code(200).send({login: req.user.login, id: req.user.id, title: req.user.title })
}

async function onUserConnection(login, userId) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction(async (tx) => {
        const envelope = {
            id: evtId,
            type: 'user.status',
            version: 1,
            source: 'main-backend',
            occurredAt: now.toISOString(),
            aggregate: { type: 'user', login: login },
            data: { login: login, id: userId, status: 'ONLINE' }
        };
        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: 0,
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    });
}

async function onUserDisconnection(login, userId) {
    const now = new Date();
    const evtId = randomUUID();

    await server.prisma.$transaction(async (tx) => {
        const envelope = {
            id: evtId,
            type: 'user.status',
            version: 1,
            source: 'main-backend',
            occurredAt: now.toISOString(),
            aggregate: { type: 'user', login: login },
            data: { login: login, id: userId, status: 'OFFLINE' }
        };
        await tx.outbox.create({
            data: {
                id: evtId,
                type: envelope.type,
                aggregateId: 0,
                occurredAt: now,
                payload: JSON.stringify(envelope)
            }
        });
    });
}

export default { userMe, onUserConnection, onUserDisconnection }
