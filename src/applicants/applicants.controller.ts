import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApplicantsService } from './applicants.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { QueryApplicantsDto } from './dto/query-applicants.dto';
import { ApplicantResponseDto } from './dto/applicant-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('applicants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('api/applicants')
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new applicant' })
  @ApiResponse({ status: 201, type: ApplicantResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  create(@Body() dto: CreateApplicantDto) {
    return this.applicantsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List applicants (paginated, searchable, filterable, sortable)',
  })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: QueryApplicantsDto) {
    return this.applicantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single applicant by id' })
  @ApiResponse({ status: 200, type: ApplicantResponseDto })
  @ApiResponse({ status: 404, description: 'Applicant not found' })
  findOne(@Param('id') id: string) {
    return this.applicantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update applicant details' })
  @ApiResponse({ status: 200, type: ApplicantResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateApplicantDto) {
    return this.applicantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an applicant' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.applicantsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Update an applicant's status (enforces valid transitions)",
  })
  @ApiResponse({ status: 200, type: ApplicantResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.applicantsService.updateStatus(id, dto);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: "Update an applicant's internal notes" })
  @ApiResponse({ status: 200, type: ApplicantResponseDto })
  updateNotes(@Param('id') id: string, @Body() dto: UpdateNotesDto) {
    return this.applicantsService.updateNotes(id, dto);
  }
}
