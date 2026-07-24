import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects routes with bearer-token JWT authentication.
 * Apply with `@UseGuards(JwtAuthGuard)` on any controller/handler that
 * requires an authenticated administrator.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
