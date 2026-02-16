import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await argon2.hash('JeSuisUneIa')
  await prisma.user.upsert({
    where: { login: 'IA' },
    update: {title: 'IA', avatarUrl: "/app/public/avatars/terminator.webp", }, // nothing to update if already exists
    create: {
      login: 'IA',
      title: 'IA',
      passwordHash,
      firstName: 'IA',
      lastName: 'IA',
      avatarMime: "image/webp",
      avatarUrl: "/app/public/avatars/terminator.webp",
    }
  })
  const passwordHash1 = await argon2.hash('lderidde')
  await prisma.user.upsert({
    where: { login: 'lderidde' },
    update: {title: 'USER',}, // nothing to update if already exists
    create: {
      login: 'lderidde',
      title: 'USER',
      passwordHash: passwordHash1,
      firstName: 'Loic',
      lastName: 'Deridder',
      avatarMime: "image/jpeg",
      avatarUrl: "/app/public/avatars/lderidde.jpeg",
    }
  })
  const passwordHash2 = await argon2.hash('nalebrun')
  await prisma.user.upsert({
    where: { login: 'nalebrun' },
    update: {title: 'USER',}, // nothing to update if already exists
    create: {
      login: 'nalebrun',
      title: 'USER',
      passwordHash: passwordHash2,
      firstName: 'Nathan',
      lastName: 'Lebrun',
      avatarMime: "image/jpeg",
      avatarUrl: "/app/public/avatars/nalebrun.jpeg",
    }
  })
  const passwordHash3 = await argon2.hash('qmorinea')
  await prisma.user.upsert({
    where: { login: 'qmorinea' },
    update: {title: 'USER',}, // nothing to update if already exists
    create: {
      login: 'qmorinea',
      title: 'USER',
      passwordHash: passwordHash3,
      firstName: 'Quentin',
      lastName: 'Morineau',
      avatarMime: "image/jpeg",
      avatarUrl: "/app/public/avatars/qmorinea.jpeg",
    }
  })
  const passwordHash4 = await argon2.hash('vhumblet')
  await prisma.user.upsert({
    where: { login: 'vhumblet' },
    update: {}, // nothing to update if already exists
    create: {
      login: 'vhumblet',
      title: 'USER',
      passwordHash: passwordHash4,
      firstName: 'Quentin',
      lastName: 'Morineau',
    }
  })
  const passwordHash5 = await argon2.hash('fuckskynet')
  await prisma.user.upsert({
    where: { login: 'JConnor' },
    update: {}, // nothing to update if already exists
    create: {
      login: 'JConnor',
      title: 'USER',
      passwordHash: passwordHash5,
      firstName: 'John',
      lastName: 'Connor',
      avatarMime: "image/webp",
      avatarUrl: "/app/public/avatars/jconnor.webp",
    }
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })