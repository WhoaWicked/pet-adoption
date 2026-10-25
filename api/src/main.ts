import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Env } from './config/env';

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
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
bootstrap();
