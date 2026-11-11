import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.constants";

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
}