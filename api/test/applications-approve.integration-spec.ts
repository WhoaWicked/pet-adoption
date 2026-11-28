import { Pool } from 'pg';
import { AiSummariesRepository } from '../src/ai/ai-summaries.repository';
import { ApplicationRow, ApplicationsRepository } from '../src/applications/applications.repository';
import { NotificationRow, NotificationsRepository } from '../src/notifications/notifications.repository';
import { PetRow } from '../src/pets/pets.repository';

describe('ApplicationsRepository.approve (integration)', () => {
    let pool: Pool;
    let repo: ApplicationsRepository;
    let notification: NotificationsRepository;
    let aiSummary: AiSummariesRepository;
    const userIds: string[] = [];
    let petId: string;
    const applicationIds: string[] = [];

    beforeAll(async () => {
        pool = new Pool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        notification = new NotificationsRepository(pool);
        aiSummary = new AiSummariesRepository(pool);
        repo = new ApplicationsRepository(pool, notification, aiSummary);
    });

    beforeEach(async () => {
        userIds.length = 0;
        applicationIds.length = 0;
        // Seed an owner, an applicant, a pet and one application to hang summaries on.
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        for (const role of ['owner', 'applicant1', 'applicant2']) {
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
        const app1 = await pool.query<{ id: string }>(
            `INSERT INTO adoption_applications (pet_id, applicant_id, answers)
       VALUES ($1, $2, '{"housingType":"condo","hasPetExperience":true}') RETURNING id`,
            [petId, userIds[1]],
        );
        const app2 = await pool.query<{ id: string }>(
            `INSERT INTO adoption_applications (pet_id, applicant_id, answers)
       VALUES ($1, $2, '{"housingType":"condo","hasPetExperience":true}') RETURNING id`,
            [petId, userIds[2]],
        );
        applicationIds.push(app1.rows[0].id);
        applicationIds.push(app2.rows[0].id);
    });

    afterEach(async () => {
        // Deleting the application cascades to ai_summaries; pets/users are RESTRICT.
        await pool.query('DELETE FROM adoption_applications WHERE pet_id = $1', [petId]);
        await pool.query('DELETE FROM pets WHERE owner_id = $1', [userIds[0]]);
        await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [userIds]);
    })

    afterAll(async () => {
        await pool.end();
    });

    it('approves the application and marks the pet as adopted', async () => {
        const result = await repo.approve(applicationIds[0], petId);
        expect(result).toMatchObject({ status: 'approved' });
        const { rows } = await pool.query<PetRow>('SELECT * FROM pets WHERE id = $1;', [petId]);
        expect(rows[0].status).toBe('adopted');
    });

    it('rejects the other pending applications for the same pet', async () => {
        await repo.approve(applicationIds[0], petId);
        const { rows } = await pool.query<ApplicationRow>(`
            SELECT status, decided_at FROM adoption_applications WHERE id = $1;`,
            [applicationIds[1]]);
        expect(rows[0].status).toBe('rejected');
        expect(rows[0].decided_at).not.toBeNull();
    });

    it('notifies the winner and the rejected applicants', async () => {
        await repo.approve(applicationIds[0], petId);

        const winner = await pool.query<NotificationRow>(
            'SELECT type, entity_id FROM notifications WHERE user_id = $1;',
            [userIds[1]]
        );
        expect(winner.rows).toHaveLength(1);
        expect(winner.rows[0]).toMatchObject({ type: 'application.approved', entity_id: applicationIds[0] });

        const loser = await pool.query<NotificationRow>(
            'SELECT type, entity_id FROM notifications WHERE user_id = $1;',
            [userIds[2]]
        );
        expect(loser.rows).toHaveLength(1);
        expect(loser.rows[0]).toMatchObject({ type: 'application.rejected', entity_id: applicationIds[1] });
    });

    it('returns undefined and changes nothing when the pet is not available', async () => {
        // จัดฉาก: ทำให้สัตว์ไม่ว่าง (แก้ตรงในฐานข้อมูล)
        await pool.query(`
            UPDATE pets SET status = 'closed' WHERE id = $1;`, [petId]);

        const result = await repo.approve(applicationIds[0], petId);

        expect(result).toBe(undefined);

        // ไม่มีอะไรเปลี่ยน: คำขอทั้งสองยังเป็น pending
        const { rows } = await pool.query<ApplicationRow>(
            'SELECT status FROM adoption_applications WHERE pet_id = $1;',
            [petId],
        );
        expect(rows.map((r) => r.status)).toEqual(['pending', 'pending']);

        // และไม่มีแจ้งเตือนถูกสร้างเลย
        const notifications = await pool.query(
            'SELECT 1 FROM notifications WHERE user_id = ANY($1::uuid[]);',
            [userIds],
        );
        expect(notifications.rows).toHaveLength(0);
    });

    it('does not approve an application that belongs to a different pet', async () => {
        // จัดฉาก: สร้างสัตว์ตัวที่สอง (ว่าง) ของเจ้าของคนเดียวกัน
        const other = await pool.query<{ id: string }>(`
        INSERT INTO pets (owner_id, name, species, age_months, province, description, requirements)
       VALUES ($1, 'Mala', 'dog', 12, 'Bangkok', 'd', 'r') RETURNING id`, [userIds[0]]);
        const otherPetId = other.rows[0].id;

        // เรียก approve ด้วยคำขอของสัตว์ A แต่ส่ง id ของสัตว์ B
        const result = await repo.approve(applicationIds[0], otherPetId);

        expect(result).toBe(undefined);

        // ไม่มีอะไรเปลี่ยน
        const app = await pool.query<ApplicationRow>('SELECT status FROM adoption_applications WHERE id = $1;', [applicationIds[0]]);
        expect(app.rows[0].status).toBe('pending');

        const pets = await pool.query<PetRow>('SELECT status FROM pets WHERE id = ANY($1::uuid[]);', [[petId, otherPetId]]);
        expect(pets.rows.map((r) => r.status)).toEqual(['available', 'available']);
    });
})