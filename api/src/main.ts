import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Env } from './config/env';

// Do not export anything from this file. On Vercel it is the function's
// entrypoint: with no exports the launcher waits for app.listen(), but any
// export makes it expect a function or server and the API fails to boot.
// The function's max duration is therefore a Vercel project setting.
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
