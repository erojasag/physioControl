import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditService } from "./common/audit.service";
import { ClerkAuthGuard } from "./common/clerk-auth.guard";
import { TenantContextMiddleware } from "./common/tenant-context.middleware";
import { HealthController } from "./health.controller";
import { IdentityController } from "./modules/identity/identity.controller";
import { PatientsModule } from "./modules/patients/patients.module";
import { SchedulingModule } from "./modules/scheduling/scheduling.module";

@Module({
  imports: [PatientsModule, SchedulingModule],
  controllers: [HealthController, IdentityController],
  providers: [
    AuditService,
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
  ],
  exports: [AuditService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Resolve tenant context for every request before the guard runs.
    consumer.apply(TenantContextMiddleware).forRoutes("*");
  }
}
