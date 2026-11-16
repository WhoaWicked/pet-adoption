import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.constants";
import { PetRow } from "../pets/pets.repository";

export interface ApplicationAnswers {
    housingType: 'house' | 'condo' | 'apartment' | 'other';
    hasPetExperience: boolean;
    note?: string;
}

export interface ApplicationRow {
    id: string;
    pet_id: string;
    applicant_id: string;
    answers: ApplicationAnswers;
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    created_at: Date;
    decided_at: Date | null;
}

export interface MyApplicationRow extends ApplicationRow {
    pet_name: string;
    pet_status: 'available' | 'adopted' | 'closed';
}

export interface ApplicationListResult {
    rows: MyApplicationRow[];
    total: number;
}

export interface PetsApplicationRow extends ApplicationRow {
    display_name: string;
}

@Injectable()
export class ApplicationsRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }
    async findById(id: string): Promise<ApplicationRow | undefined> {
        const query = `SELECT * FROM adoption_applications WHERE id = $1`;
        const result = await this.pool.query<ApplicationRow>(query, [id]);
        return result.rows[0];
    }
    async create(petId: string, applicantId: string, answers: ApplicationAnswers): Promise<ApplicationRow | undefined> {
        const query = `
        INSERT INTO adoption_applications (pet_id, applicant_id, answers) 
        VALUES ($1, $2, $3)
        ON CONFLICT (pet_id, applicant_id)
        DO UPDATE SET status = 'pending', answers = EXCLUDED.answers, created_at = NOW(), decided_at = NULL
        WHERE adoption_applications.status = 'withdrawn' RETURNING *`;
        const result = await this.pool.query<ApplicationRow>(query, [petId, applicantId, answers]);
        return result.rows[0];
    }
    async withdraw(id: string): Promise<ApplicationRow | undefined> {
        const query = `UPDATE adoption_applications SET status = 'withdrawn'
        WHERE id = $1 AND status = 'pending' RETURNING *`;
        const result = await this.pool.query<ApplicationRow>(query, [id]);
        return result.rows[0];
    }
    async findMine(applicantId: string, limit: number, offset: number): Promise<ApplicationListResult> {
        const countQuery = `SELECT COUNT(*)::int AS total FROM adoption_applications WHERE applicant_id = $1`;
        const query = `SELECT a.*, p.name AS pet_name, p.status AS pet_status
        FROM adoption_applications AS a JOIN pets AS p ON p.id = a.pet_id
        WHERE a.applicant_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2 OFFSET $3;`;
        const count = await this.pool.query<{ total: number }>(countQuery, [applicantId]);
        const result = await this.pool.query<MyApplicationRow>(query, [applicantId, limit, offset]);
        return { rows: result.rows, total: count.rows[0].total }
    }
    async reject(id: string): Promise<ApplicationRow | undefined> {
        const query = `UPDATE adoption_applications SET status = 'rejected', decided_at = NOW()
        WHERE id = $1 AND status = 'pending' RETURNING *`;
        const result = await this.pool.query<ApplicationRow>(query, [id]);
        return result.rows[0];
    }
    async findByPet(petId: string): Promise<PetsApplicationRow[]> {
        const query = `SELECT a.*, u.display_name AS applicant_name
        FROM adoption_applications a
        JOIN users u ON u.id = a.applicant_id
        WHERE a.pet_id = $1
        ORDER BY a.created_at DESC;`;
        const result = await this.pool.query<PetsApplicationRow>(query, [petId]);
        return result.rows;
    }
    async approve(applicationId: string, petId: string): Promise<ApplicationRow | undefined> {
        const queryPet = `SELECT * FROM pets WHERE id = $1 FOR UPDATE;`;
        const queryApproved = `UPDATE adoption_applications SET status = 'approved', decided_at = NOW()
        WHERE id = $1 AND status = 'pending' RETURNING *;`;
        const queryRejected = `UPDATE adoption_applications SET status = 'rejected', decided_at = NOW()
        WHERE pet_id = $2 AND id <> $1 AND status = 'pending';`;
        const queryAdopted = `UPDATE pets SET status = 'adopted', updated_at = NOW()
        WHERE id = $1 AND status = 'available';`;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const pet = await client.query<PetRow>(queryPet, [petId]);
            if (pet.rows[0]?.status !== 'available') {
                await client.query('ROLLBACK');
                return undefined;
            }
            const approved = await client.query<ApplicationRow>(queryApproved, [applicationId]);
            if (approved.rows.length === 0) {
                await client.query('ROLLBACK');
                return undefined;
            }
            await client.query(queryRejected, [applicationId, petId]);
            await client.query(queryAdopted, [petId]);
            await client.query('COMMIT');
            return approved.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}