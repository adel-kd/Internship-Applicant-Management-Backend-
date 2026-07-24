import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT bearer token' })
  accessToken: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ type: AdminProfileDto })
  admin: AdminProfileDto;
}
