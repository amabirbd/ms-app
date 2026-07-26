import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./platform/problem-details.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableCors({
    origin: process.env.WEB_ORIGINS?.split(",") ?? [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.use(
    (
      request: { headers: Record<string, string>; id?: string },
      response: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      const requestId = request.headers["x-request-id"] || randomUUID();
      request.id = requestId;
      response.setHeader("x-request-id", requestId);
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("B2B Commerce API")
      .setDescription(
        "Tenant-scoped public API. Internal service APIs are not exposed by this gateway.",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document);

  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}

void bootstrap();
