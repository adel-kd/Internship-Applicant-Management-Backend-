import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
}

/**
 * Extracts the authenticated admin (attached to the request by JwtStrategy)
 * for use in controller handlers, e.g. `@CurrentAdmin() admin: AuthenticatedAdmin`.
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
