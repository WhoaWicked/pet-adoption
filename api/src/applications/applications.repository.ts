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

}