import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";
import { loadConfig } from "./config/config";

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  if (config.SENTRY_DSN) {
    Sentry.init({ dsn: config.SENTRY_DSN, environment: config.NODE_ENV });
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true });
  // Zod at every boundary — global validation pipe.
  app.useGlobalPipes(new ZodValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("PhysioSaaS API")
    .setVersion("0.0.0")
    .build();
  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(config.API_PORT);
}

void bootstrap();
