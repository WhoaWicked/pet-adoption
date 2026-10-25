import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Env } from '../config/env';
import { PG_POOL } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        // Pool connects lazily, so the API can boot even if Postgres is down.
        const pool = new Pool({
          host: config.get('DB_HOST', { infer: true }),
          port: config.get('DB_PORT', { infer: true }),
          database: config.get('DB_NAME', { infer: true }),
          user: config.get('DB_USER', { infer: true }),
          password: config.get('DB_PASSWORD', { infer: true }),
          connectionTimeoutMillis: 2000,
        });
        // An error on an idle client would otherwise crash the process.
        pool.on('error', (err) => {
          new Logger('DatabasePool').error(`Idle client error: ${err.message}`);
        });
        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Graceful shutdown: runs when the app stops (needs enableShutdownHooks).
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
