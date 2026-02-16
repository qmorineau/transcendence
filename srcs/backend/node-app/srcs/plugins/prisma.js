import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async (fastify) => {
  const prisma = new PrismaClient()
  await prisma.$connect();
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
  await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL');
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 3000');

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => prisma.$disconnect());
});