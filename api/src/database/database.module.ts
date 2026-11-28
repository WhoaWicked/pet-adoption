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

// Used when the matching env variable is unset. 10 is pg's own default.
const DEFAULT_POOL_MAX = 10;
const DEFAULT_CONNECTION_TIMEOUT_MS = 2000;

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
          // Each serverless instance has its own pool, so hosts like Vercel
          // set a smaller max, and a longer timeout so a sleeping Neon
          // database has time to wake up.
          max: config.get('DB_POOL_MAX', { infer: true }) || DEFAULT_POOL_MAX,
          connectionTimeoutMillis:
            config.get('DB_CONNECTION_TIMEOUT_MS', { infer: true }) ||
            DEFAULT_CONNECTION_TIMEOUT_MS,
          // Managed Postgres (e.g. Neon) requires SSL. The key is only added
          // when DB_SSL=true, so otherwise pg behaves as it did without it.
          ...(config.get('DB_SSL', { infer: true }) === true
            ? { ssl: { rejectUnauthorized: true } }
            : {}),
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
