import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, InternshipTrack } from '../applicant.enums';

export class ApplicantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() phone?: string | null;
  @ApiProperty({ enum: InternshipTrack }) track: InternshipTrack;
  @ApiProperty({ enum: ApplicationStatus }) status: ApplicationStatus;
  @ApiPropertyOptional() resumeUrl?: string | null;
  @ApiPropertyOptional() coverLetter?: string | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
