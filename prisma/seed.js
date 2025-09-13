// prisma/seed.js
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const acme = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme', slug: 'acme' },
  });

  const globex = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: { name: 'Globex', slug: 'globex' },
  });

  const password = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: { email: 'admin@acme.test', password, role: 'ADMIN', tenantId: acme.id },
  });

  await prisma.user.upsert({
    where: { email: 'user@acme.test' },
    update: {},
    create: { email: 'user@acme.test', password, role: 'MEMBER', tenantId: acme.id },
  });

  await prisma.user.upsert({
    where: { email: 'admin@globex.test' },
    update: {},
    create: { email: 'admin@globex.test', password, role: 'ADMIN', tenantId: globex.id },
  });

  await prisma.user.upsert({
    where: { email: 'user@globex.test' },
    update: {},
    create: { email: 'user@globex.test', password, role: 'MEMBER', tenantId: globex.id },
  });

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
