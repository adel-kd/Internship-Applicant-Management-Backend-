import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, InternshipTrack } from '../applicants/applicant.enums';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const notDeleted = { deletedAt: null } as const;

    const [total, statusGroups, trackGroups, newLast7Days] = await Promise.all([
      this.prisma.applicant.count({ where: notDeleted }),
      this.prisma.applicant.groupBy({
        by: ['status'],
        where: notDeleted,
        _count: { _all: true },
      }),
      this.prisma.applicant.groupBy({
        by: ['track'],
        where: notDeleted,
        _count: { _all: true },
      }),
      this.prisma.applicant.count({
        where: {
          ...notDeleted,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const byStatus = Object.fromEntries(
      Object.values(ApplicationStatus).map((s) => [s, 0]),
    ) as Record<ApplicationStatus, number>;
    statusGroups.forEach((g) => {
      byStatus[g.status as ApplicationStatus] = g._count._all;
    });

    const byTrack = Object.fromEntries(
      Object.values(InternshipTrack).map((t) => [t, 0]),
    ) as Record<InternshipTrack, number>;
    trackGroups.forEach((g) => {
      byTrack[g.track as InternshipTrack] = g._count._all;
    });

    return {
      totalApplicants: total,
      byStatus: byStatus as any,
      byTrack: byTrack as any,
      newApplicantsLast7Days: newLast7Days,
    };
  }
}
