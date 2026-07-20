import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getTenantContext } from "@physio/db";
import { IS_PUBLIC_KEY } from "./public.decorator";

// Global guard: every route requires a resolved tenant context (set by
// TenantContextMiddleware) unless explicitly marked @Public.
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    if (!getTenantContext()) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
