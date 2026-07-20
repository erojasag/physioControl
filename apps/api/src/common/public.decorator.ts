import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Mark a route/controller as reachable without an authenticated tenant context
// (health checks, public self-booking, provider webhooks).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
