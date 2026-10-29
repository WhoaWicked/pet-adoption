import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.constants";

export interface UserRow {
    id: string;
    email: string;
    password_hash: string;
}

export interface CreatedUser {
    id: string;
    email: string;
    display_name: string;
}

@Injectable()
export class AuthRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }
    async createUser(email: string, passwordHash: string, displayName: string): Promise<CreatedUser> {
        const query = `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name;`;
        const result = await this.pool.query<CreatedUser>(query, [email, passwordHash, displayName]);
        return result.rows[0];
    }

    async findByEmail(email: string): Promise<UserRow | undefined> {
        const query = "SELECT id, email, password_hash FROM users WHERE email = $1;";
        const user = await this.pool.query<UserRow>(query, [email]);
        return user.rows[0];
    }
}