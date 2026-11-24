import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { AiSummaryRow, UpsertAiSummaryInput } from './summary.types';

// Raw SQL access to ai_summaries. No business logic here: it does not check
// ownership, application status or count attempts. Every method takes an
// optional PoolClient so callers can run it inside their own transaction.
@Injectable()
export class AiSummariesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByApplicationId(
    applicationId: string,
    client?: PoolClient,
  ): Promise<AiSummaryRow | undefined> {
    const db = client ?? this.pool;
    const query = `SELECT * FROM ai_summaries WHERE application_id = $1;`;
    const result = await db.query<AiSummaryRow>(query, [applicationId]);
    return result.rows[0];
  }

  // Insert or overwrite the whole row for this application (PK application_id),
  // so there is always at most one row. Fields left out become null / 0.
  async upsert(input: UpsertAiSummaryInput, client?: PoolClient): Promise<AiSummaryRow> {
    const db = client ?? this.pool;
    const query = `INSERT INTO ai_summaries
        (application_id, status, summary, last_error, attempts, updated_at)
      VALUES ($1, $2, $3::jsonb, $4, $5, now())
      ON CONFLICT (application_id) DO UPDATE SET
        status = EXCLUDED.status,
        summary = EXCLUDED.summary,
        last_error = EXCLUDED.last_error,
        attempts = EXCLUDED.attempts,
        updated_at = now()
      RETURNING *;`;
    const result = await db.query<AiSummaryRow>(query, [
      input.applicationId,
      input.status,
      input.summary === undefined ? null : JSON.stringify(input.summary),
      input.lastError ?? null,
      input.attempts ?? 0,
    ]);
    return result.rows[0];
  }

  // Remove this application's summary row, if any. Deleting a row that does
  // not exist is not an error, so callers can reset without checking first.
  async deleteByApplicationId(applicationId: string, client?: PoolClient): Promise<void> {
    const db = client ?? this.pool;
    const query = `DELETE FROM ai_summaries WHERE application_id = $1;`;
    await db.query(query, [applicationId]);
  }
}
