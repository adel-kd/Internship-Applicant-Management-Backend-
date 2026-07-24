import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { admin: { findUnique: jest.Mock } };
  let jwtService: { signAsync: jest.Mock };

  const admin = {
    id: 'admin-1',
    email: '[email protected]',
    name: 'System Administrator',
    passwordHash: '',
  };

  beforeAll(async () => {
    admin.passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  });

  beforeEach(async () => {
    prisma = { admin: { findUnique: jest.fn() } };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns an access token for valid credentials', async () => {
    prisma.admin.findUnique.mockResolvedValue(admin);

    const result = await service.login({
      email: '[email protected]',
      password: 'ChangeMe123!',
    });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.admin.email).toBe(admin.email);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: admin.id,
      email: admin.email,
    });
  });

  it('throws UnauthorizedException for an unknown email', async () => {
    prisma.admin.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: '[email protected]', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException for an incorrect password', async () => {
    prisma.admin.findUnique.mockResolvedValue(admin);

    await expect(
      service.login({ email: '[email protected]', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
