import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateNotesDto {
  @ApiProperty({
    example: 'Strong portfolio, follow up after the technical interview.',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes: string;
}
