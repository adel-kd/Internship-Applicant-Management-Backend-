import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, InternshipTrack } from '../applicants/applicant.enums';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    applicant: {
      count: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      applicant: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('builds a full status/track breakdown, defaulting missing buckets to zero', async () => {
    prisma.applicant.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2); // last 7 days
    prisma.applicant.groupBy
      .mockResolvedValueOnce([
        { status: ApplicationStatus.PENDING, _count: { _all: 6 } },
        { status: ApplicationStatus.SHORTLISTED, _count: { _all: 4 } },
      ])
      .mockResolvedValueOnce([
        { track: InternshipTrack.BACKEND_DEVELOPMENT, _count: { _all: 10 } },
      ]);

    const summary = await service.getSummary();

    expect(summary.totalApplicants).toBe(10);
    expect(summary.byStatus.PENDING).toBe(6);
    expect(summary.byStatus.SHORTLISTED).toBe(4);
    expect(summary.byStatus.ACCEPTED).toBe(0);
    expect(summary.byStatus.REJECTED).toBe(0);
    expect(summary.byTrack.BACKEND_DEVELOPMENT).toBe(10);
    expect(summary.byTrack.FRONTEND_DEVELOPMENT).toBe(0);
    expect(summary.newApplicantsLast7Days).toBe(2);
  });
});
