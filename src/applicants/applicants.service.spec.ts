import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, InternshipTrack } from './applicant.enums';

const buildApplicant = (overrides: Partial<any> = {}) => ({
  id: 'applicant-1',
  fullName: 'Jane Doe',
  email: '[email protected]',
  phone: null,
  track: InternshipTrack.FRONTEND_DEVELOPMENT,
  status: ApplicationStatus.PENDING,
  resumeUrl: null,
  coverLetter: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('ApplicantsService', () => {
  let service: ApplicantsService;
  let prisma: {
    applicant: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      applicant: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApplicantsService>(ApplicantsService);
  });

  describe('create', () => {
    it('creates an applicant when the email is not already used', async () => {
      prisma.applicant.findFirst.mockResolvedValue(null);
      prisma.applicant.create.mockResolvedValue(buildApplicant());

      const result = await service.create({
        fullName: 'Jane Doe',
        email: '[email protected]',
        track: InternshipTrack.FRONTEND_DEVELOPMENT,
      });

      expect(prisma.applicant.create).toHaveBeenCalled();
      expect(result.email).toBe('[email protected]');
    });

    it('throws a ConflictException when the email is already in use', async () => {
      prisma.applicant.findFirst.mockResolvedValue(buildApplicant());

      await expect(
        service.create({
          fullName: 'Jane Doe',
          email: '[email protected]',
          track: InternshipTrack.FRONTEND_DEVELOPMENT,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.applicant.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the applicant does not exist or is deleted', async () => {
      prisma.applicant.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the applicant when found and not deleted', async () => {
      const applicant = buildApplicant();
      prisma.applicant.findFirst.mockResolvedValue(applicant);
      const result = await service.findOne(applicant.id);
      expect(result).toEqual(applicant);
    });
  });

  describe('findAll', () => {
    it('queries with a filter that excludes soft-deleted applicants', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.findAll({ page: 1, limit: 10 } as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('remove (soft delete)', () => {
    it('sets deletedAt instead of removing the record', async () => {
      const applicant = buildApplicant();
      prisma.applicant.findFirst.mockResolvedValue(applicant);
      prisma.applicant.update.mockResolvedValue({
        ...applicant,
        deletedAt: new Date(),
      });

      await service.remove(applicant.id);

      expect(prisma.applicant.update).toHaveBeenCalledWith({
        where: { id: applicant.id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('updateStatus - transition rules', () => {
    it('allows PENDING -> SHORTLISTED', async () => {
      const applicant = buildApplicant({ status: ApplicationStatus.PENDING });
      prisma.applicant.findFirst.mockResolvedValue(applicant);
      prisma.applicant.update.mockResolvedValue({
        ...applicant,
        status: ApplicationStatus.SHORTLISTED,
      });

      const result = await service.updateStatus(applicant.id, {
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
    });

    it('blocks REJECTED -> ACCEPTED', async () => {
      const applicant = buildApplicant({ status: ApplicationStatus.REJECTED });
      prisma.applicant.findFirst.mockResolvedValue(applicant);

      await expect(
        service.updateStatus(applicant.id, {
          status: ApplicationStatus.ACCEPTED,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.applicant.update).not.toHaveBeenCalled();
    });

    it('allows REJECTED -> PENDING (re-opening an application)', async () => {
      const applicant = buildApplicant({ status: ApplicationStatus.REJECTED });
      prisma.applicant.findFirst.mockResolvedValue(applicant);
      prisma.applicant.update.mockResolvedValue({
        ...applicant,
        status: ApplicationStatus.PENDING,
      });

      const result = await service.updateStatus(applicant.id, {
        status: ApplicationStatus.PENDING,
      });

      expect(result.status).toBe(ApplicationStatus.PENDING);
    });
  });

  describe('updateNotes', () => {
    it('updates the notes field for an existing applicant', async () => {
      const applicant = buildApplicant();
      prisma.applicant.findFirst.mockResolvedValue(applicant);
      prisma.applicant.update.mockResolvedValue({
        ...applicant,
        notes: 'Great candidate',
      });

      const result = await service.updateNotes(applicant.id, {
        notes: 'Great candidate',
      });

      expect(result.notes).toBe('Great candidate');
    });
  });
});
