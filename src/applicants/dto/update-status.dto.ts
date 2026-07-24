import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../applicant.enums';

export class UpdateStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.SHORTLISTED })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
