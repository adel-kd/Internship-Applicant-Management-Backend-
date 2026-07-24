import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApplicationStatus, InternshipTrack } from '../applicant.enums';

export enum ApplicantSortField {
  CREATED_AT = 'createdAt',
  FULL_NAME = 'fullName',
  STATUS = 'status',
  TRACK = 'track',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryApplicantsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive search across full name and email',
    example: 'jane',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ enum: InternshipTrack })
  @IsOptional()
  @IsEnum(InternshipTrack)
  track?: InternshipTrack;

  @ApiPropertyOptional({ enum: ApplicantSortField, default: ApplicantSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(ApplicantSortField)
  sortBy?: ApplicantSortField = ApplicantSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder = SortOrder.DESC;
}
