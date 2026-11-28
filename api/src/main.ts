import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Env } from './config/env';

// Read by Vercel at build time (Nest ignores it): the longest one request may
// run, in seconds. It has to cover a cold start, connecting to the database and
// the 15 s AI timeout (AI_TIMEOUT_MS), so the API can still answer with its own
// error instead of Vercel cutting the request off with a 504.
export const config = { maxDuration: 60 };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Needed so DatabaseModule.onApplicationShutdown closes the pool on SIGINT/SIGTERM.
  app.enableShutdownHooks();
  // Validates every request body/query against its DTO's class-validator rules.
  // whitelist drops unknown properties, forbidNonWhitelisted rejects them with 400,
  // transform turns plain JSON into DTO instances (and "5" into 5 where typed).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  // CORS stays off unless CORS_ORIGIN lists the web app's origins. Local dev
  // does not need it because the Vite proxy makes requests same-origin.
  const corsOrigins = configService.get('CORS_ORIGIN', { infer: true });
  if (Array.isArray(corsOrigins)) {
    app.enableCors({ origin: corsOrigins });
  }
  await app.listen(configService.get('PORT', { infer: true }));
}
bootstrap();
