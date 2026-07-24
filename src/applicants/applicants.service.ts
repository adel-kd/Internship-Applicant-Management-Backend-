import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { QueryApplicantsDto } from './dto/query-applicants.dto';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';
import { ALLOWED_STATUS_TRANSITIONS, ApplicationStatus } from './applicant.enums';

@Injectable()
export class ApplicantsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Base filter that every read operation applies to exclude soft-deleted applicants. */
  private get notDeleted(): Prisma.ApplicantWhereInput {
    return { deletedAt: null };
  }

  async create(dto: CreateApplicantDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.applicant.findFirst({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('An applicant with this email already exists');
    }

    return this.prisma.applicant.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone,
        track: dto.track,
        resumeUrl: dto.resumeUrl,
        coverLetter: dto.coverLetter,
      },
    });
  }

  async findAll(query: QueryApplicantsDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.ApplicantWhereInput = {
      ...this.notDeleted,
      ...(query.status ? { status: query.status } : {}),
      ...(query.track ? { track: query.track } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search } },
              { email: { contains: query.search } },
            ],
          }
        : {}),
    };

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.applicant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.applicant.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(id: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id, ...this.notDeleted },
    });
    if (!applicant) {
      throw new NotFoundException(`Applicant with id ${id} not found`);
    }
    return applicant;
  }

  async update(id: string, dto: UpdateApplicantDto) {
    await this.findOne(id); // ensures existence + not deleted

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const existing = await this.prisma.applicant.findFirst({
        where: { email, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('An applicant with this email already exists');
      }
    }

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email ? dto.email.toLowerCase().trim() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.applicant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const applicant = await this.findOne(id);

    const currentStatus = applicant.status as ApplicationStatus;
    const nextStatus = dto.status;

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus];
    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${nextStatus}`,
      );
    }

    return this.prisma.applicant.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  async updateNotes(id: string, dto: UpdateNotesDto) {
    await this.findOne(id);
    return this.prisma.applicant.update({
      where: { id },
      data: { notes: dto.notes },
    });
  }
}
