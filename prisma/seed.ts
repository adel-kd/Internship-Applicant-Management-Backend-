import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@infnova.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'System Administrator';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
    },
  });
  console.log(`Seeded admin: ${admin.email}`);

  const sampleApplicants: Array<{
    fullName: string;
    email: string;
    phone?: string;
    track: string;
    status: string;
    notes?: string;
  }> = [
    {
      fullName: 'Abebe Kebede',
      email: 'abebe.kebede@example.com',
      phone: '+251911000001',
      track: 'FRONTEND_DEVELOPMENT',
      status: 'PENDING',
    },
    {
      fullName: 'Sara Mohammed',
      email: 'sara.mohammed@example.com',
      phone: '+251911000002',
      track: 'BACKEND_DEVELOPMENT',
      status: 'SHORTLISTED',
      notes: 'Strong Node.js background, invite for technical interview.',
    },
    {
      fullName: 'Daniel Tesfaye',
      email: 'daniel.tesfaye@example.com',
      phone: '+251911000003',
      track: 'MOBILE_DEVELOPMENT',
      status: 'ACCEPTED',
      notes: 'Offer sent, awaiting confirmation.',
    },
    {
      fullName: 'Liya Girma',
      email: 'liya.girma@example.com',
      phone: '+251911000004',
      track: 'UI_UX_DESIGN',
      status: 'REJECTED',
      notes: 'Portfolio did not match current track needs.',
    },
    {
      fullName: 'Yonas Alemu',
      email: 'yonas.alemu@example.com',
      phone: '+251911000005',
      track: 'DATA_ANALYTICS',
      status: 'PENDING',
    },
    {
      fullName: 'Hana Bekele',
      email: 'hana.bekele@example.com',
      phone: '+251911000006',
      track: 'FRONTEND_DEVELOPMENT',
      status: 'SHORTLISTED',
    },
  ];

  for (const applicant of sampleApplicants) {
    await prisma.applicant.upsert({
      where: { email: applicant.email },
      update: {},
      create: applicant,
    });
  }
  console.log(`Seeded ${sampleApplicants.length} sample applicants`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });