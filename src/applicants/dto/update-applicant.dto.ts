import { PartialType } from '@nestjs/swagger';
import { CreateApplicantDto } from './create-applicant.dto';

/**
 * All fields optional. Status changes go through the dedicated
 * PATCH /api/applicants/:id/status endpoint so the transition rules
 * are always enforced in one place.
 */
export class UpdateApplicantDto extends PartialType(CreateApplicantDto) {}

