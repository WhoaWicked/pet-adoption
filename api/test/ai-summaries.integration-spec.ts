import { Pool } from 'pg';
import { AiSummariesRepository } from '../src/ai/ai-summaries.repository';

// Runs against the real test database (npm run test:integration loads .env.test
// and migrates first). Not picked up by test:e2e, which has no database.
describe('AiSummariesRepository (integration)', () => {
  let pool: Pool;
  let repo: AiSummariesRepository;
  const userIds: string[] = [];
  let petId: string;
  let applicationId: string;

  const summary = { overview: 'ภาพรวม', highlights: ['ข้อดี'], concerns: [] };

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    repo = new AiSummariesRepository(pool);

    // Seed an owner, an applicant, a pet and one application to hang summaries on.
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    for (const role of ['owner', 'applicant']) {
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, 'x', $2) RETURNING id`,
        [`ai-${role}-${suffix}@test.local`, `ai ${role}`],
      );
      userIds.push(rows[0].id);
    }
    const pet = await pool.query<{ id: string }>(
      `INSERT INTO pets (owner_id, name, species, age_months, province, description, requirements)
       VALUES ($1, 'Mali', 'cat', 12, 'Bangkok', 'd', 'r') RETURNING id`,
      [userIds[0]],
    );
    petId = pet.rows[0].id;
    const app = await pool.query<{ id: string }>(
      `INSERT INTO adoption_applications (pet_id, applicant_id, answers)
       VALUES ($1, $2, '{"housingType":"condo","hasPetExperience":true}') RETURNING id`,
      [petId, userIds[1]],
    );
    applicationId = app.rows[0].id;
  });

  afterEach(async () => {
    await pool.query('DELETE FROM ai_summaries WHERE application_id = $1', [applicationId]);
  });

  afterAll(async () => {
    // Deleting the application cascades to ai_summaries; pets/users are RESTRICT.
    await pool.query('DELETE FROM adoption_applications WHERE id = $1', [applicationId]);
    await pool.query('DELETE FROM pets WHERE id = $1', [petId]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [userIds]);
    await pool.end();
  });

  it('inserts on the first upsert, then updates the same row and bumps updated_at', async () => {
    const first = await repo.upsert({ applicationId, status: 'processing', attempts: 1 });
    expect(first).toMatchObject({ application_id: applicationId, status: 'processing', attempts: 1 });

    const second = await repo.upsert({ applicationId, status: 'done', summary, attempts: 1 });
    expect(second).toMatchObject({ status: 'done', summary });
    expect(second.created_at).toEqual(first.created_at);
    expect(second.updated_at.getTime()).toBeGreaterThan(first.updated_at.getTime());

    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS n FROM ai_summaries WHERE application_id = $1',
      [applicationId],
    );
    expect(rows[0].n).toBe(1);
  });

  it('overwrites summary and last_error with null (and attempts with 0) when they are left out', async () => {
    await repo.upsert({ applicationId, status: 'failed', summary, lastError: 'timeout', attempts: 3 });

    const row = await repo.upsert({ applicationId, status: 'pending' });

    expect(row).toMatchObject({ status: 'pending', summary: null, last_error: null, attempts: 0 });
  });

  it('returns undefined when there is no row, and the summary as an object when there is', async () => {
    await expect(repo.findByApplicationId(applicationId)).resolves.toBeUndefined();

    await repo.upsert({ applicationId, status: 'done', summary });
    const row = await repo.findByApplicationId(applicationId);

    expect(row?.summary).toEqual(summary);
  });

  it('uses the given PoolClient so a rollback leaves no row behind', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await repo.upsert({ applicationId, status: 'processing' }, client);
      await expect(repo.findByApplicationId(applicationId, client)).resolves.toBeDefined();
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    await expect(repo.findByApplicationId(applicationId)).resolves.toBeUndefined();
  });

  it('deletes the row for the application', async () => {
    await repo.upsert({ applicationId, status: 'done', summary });

    await repo.deleteByApplicationId(applicationId);

    await expect(repo.findByApplicationId(applicationId)).resolves.toBeUndefined();
  });

  it('does nothing and does not throw when there is no row to delete', async () => {
    await expect(repo.deleteByApplicationId(applicationId)).resolves.toBeUndefined();
  });

  it('deletes through the given PoolClient, so a rollback keeps the row', async () => {
    await repo.upsert({ applicationId, status: 'done', summary });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await repo.deleteByApplicationId(applicationId, client);
      await expect(repo.findByApplicationId(applicationId, client)).resolves.toBeUndefined();
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    await expect(repo.findByApplicationId(applicationId)).resolves.toMatchObject({ summary });
  });

  it('fails with a foreign key error for an application that does not exist', async () => {
    await expect(
      repo.upsert({ applicationId: '00000000-0000-4000-8000-000000000000', status: 'pending' }),
    ).rejects.toMatchObject({ code: '23503' });
  });
});
