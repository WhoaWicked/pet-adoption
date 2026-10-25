import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Needed so DatabaseModule.onApplicationShutdown closes the pool on SIGINT/SIGTERM.
  app.enableShutdownHooks();
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
bootstrap();
