import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';

const DB_CHECK_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Returns only true/false: the real error is logged here and never leaves
  // the service, so /health cannot leak connection details.
  async isDatabaseUp(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('database check timed out')),
        DB_CHECK_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([this.pool.query('SELECT 1'), timeout]);
      return true;
    } catch (err) {
      this.logger.warn(
        `Database check failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
