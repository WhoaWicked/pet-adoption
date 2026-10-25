import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Fails fast at startup if .env is missing or invalid.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
