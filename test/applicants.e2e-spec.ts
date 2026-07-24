import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

/**
 * End-to-end test covering the full applicant lifecycle.
 *
 * Requires the database to be migrated first:
 *   npx prisma migrate deploy
 *
 * Uses a dedicated admin + applicant emails so it can run repeatedly
 * against a persistent SQLite file without clashing with seed data.
 */
describe('Applicants (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let applicantId: string;

  const testAdmin = {
    email: process.env.SEED_ADMIN_EMAIL || 'e2e-admin@example.com',
    password: 'E2ePassword123!',
    name: 'E2E Test Admin',
  };
  const applicantEmail = process.env.E2E_APPLICANT_EMAIL || 'e2e-applicant@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Ensure a clean slate for this test's fixtures
    await prisma.applicant.deleteMany({ where: { email: applicantEmail } });
    await prisma.admin.deleteMany({ where: { email: testAdmin.email } });

    await prisma.admin.create({
      data: {
        email: testAdmin.email,
        name: testAdmin.name,
        passwordHash: await AuthService.hashPassword(testAdmin.password),
      },
    });
  });

  afterAll(async () => {
    await prisma.applicant.deleteMany({ where: { email: applicantEmail } });
    await prisma.admin.deleteMany({ where: { email: testAdmin.email } });
    await app.close();
  });

  it('rejects unauthenticated access to applicants', async () => {
    await request(app.getHttpServer()).get('/api/applicants').expect(401);
  });

  it('logs in and returns a bearer token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  it('returns the authenticated admin profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(testAdmin.email);
  });

  it('creates an applicant', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/applicants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName: 'E2E Applicant',
        email: applicantEmail,
        track: 'BACKEND_DEVELOPMENT',
      })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    applicantId = res.body.id;
  });

  it('rejects a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/applicants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName: 'Another Person',
        email: applicantEmail,
        track: 'BACKEND_DEVELOPMENT',
      })
      .expect(409);
  });

  it('lists applicants with pagination metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/applicants?page=1&limit=5')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('searches applicants by name', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/applicants?search=E2E Applicant')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.some((a: any) => a.email === applicantEmail)).toBe(
      true,
    );
  });

  it('moves status PENDING -> SHORTLISTED -> REJECTED', async () => {
    await request(app.getHttpServer())
      .patch(`/api/applicants/${applicantId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'SHORTLISTED' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`/api/applicants/${applicantId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'REJECTED' })
      .expect(200);

    expect(res.body.status).toBe('REJECTED');
  });

  it('blocks REJECTED -> ACCEPTED', async () => {
    await request(app.getHttpServer())
      .patch(`/api/applicants/${applicantId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(400);
  });

  it('rejects notes longer than 1000 characters', async () => {
    await request(app.getHttpServer())
      .patch(`/api/applicants/${applicantId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'a'.repeat(1001) })
      .expect(400);
  });

  it('updates notes within the limit', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/applicants/${applicantId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Looks promising.' })
      .expect(200);

    expect(res.body.notes).toBe('Looks promising.');
  });

  it('soft-deletes the applicant and excludes it from lists', async () => {
    await request(app.getHttpServer())
      .delete(`/api/applicants/${applicantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/applicants/${applicantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('returns dashboard summary statistics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.totalApplicants).toBeGreaterThanOrEqual(0);
    expect(res.body.byStatus).toBeDefined();
    expect(res.body.byTrack).toBeDefined();
  });
});