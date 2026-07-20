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
import { BookingModule } from "./modules/booking/booking.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { SchedulingModule } from "./modules/scheduling/scheduling.module";

@Module({
  imports: [IdentityModule, PatientsModule, SchedulingModule, BookingModule],
  controllers: [HealthController],
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
