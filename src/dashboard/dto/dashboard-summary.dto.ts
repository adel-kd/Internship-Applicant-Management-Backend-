import { ApiProperty } from '@nestjs/swagger';

export class StatusBreakdownDto {
  @ApiProperty() PENDING: number;
  @ApiProperty() SHORTLISTED: number;
  @ApiProperty() ACCEPTED: number;
  @ApiProperty() REJECTED: number;
}

export class TrackBreakdownDto {
  @ApiProperty() FRONTEND_DEVELOPMENT: number;
  @ApiProperty() BACKEND_DEVELOPMENT: number;
  @ApiProperty() MOBILE_DEVELOPMENT: number;
  @ApiProperty() UI_UX_DESIGN: number;
  @ApiProperty() DATA_ANALYTICS: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total non-deleted applicants' })
  totalApplicants: number;

  @ApiProperty({ type: StatusBreakdownDto })
  byStatus: StatusBreakdownDto;

  @ApiProperty({ type: TrackBreakdownDto })
  byTrack: TrackBreakdownDto;

  @ApiProperty({ description: 'Applicants created in the last 7 days' })
  newApplicantsLast7Days: number;
}
