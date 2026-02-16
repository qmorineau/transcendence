import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.userStats.upsert({
    where: { userId: 1 },
    update: {},
    create: {
      userId: 1,
    },
  });
  await prisma.userStats.upsert({
    where: { userId: 2 },
    update: {},
    create: {
      userId: 2,
    },
  });
  await prisma.userStats.upsert({
    where: { userId: 3 },
    update: {},
    create: {
      userId: 3,
    },
  });
  await prisma.userStats.upsert({
    where: { userId: 4 },
    update: {},
    create: {
      userId: 4,
    },
  });
  await prisma.userStats.upsert({
    where: { userId: 5 },
    update: {},
    create: {
      userId: 5,
    },
  });
  await prisma.userStats.upsert({
    where: { userId: 6 },
    update: { elo: 3000},
    create: {
      userId: 6,
      elo: 3000,
    },
  });
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
