import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.constants";

export interface PetRow {
    id: string;
    owner_id: string;
    name: string;
    species: 'dog' | 'cat' | 'other';
    age_months: number;
    province: string;
    description: string;
    requirements: string;
    image_url: string | null;
    status: 'available' | 'adopted' | 'closed';
    created_at: Date;
    updated_at: Date;
}

export interface CreatePetInput {
    ownerId: string;
    name: string;
    species: 'dog' | 'cat' | 'other';
    ageMonths: number;
    province: string;
    description: string;
    requirements: string
    imageUrl?: string;
}

export class PetsRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }
    async create(input: CreatePetInput): Promise<PetRow> {
        const query = `INSERT INTO pets 
    (owner_id, name,species, age_months, province, description, requirements, image_url) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
        const newPet = await this.pool.query<PetRow>(query, [
            input.ownerId,
            input.name,
            input.species,
            input.ageMonths,
            input.province,
            input.description,
            input.requirements,
            input.imageUrl
        ]);
        return newPet.rows[0];
    }
    async findById(id: string): Promise<PetRow | undefined> {
        const query = `SELECT * FROM pets WHERE id = $1;`;
        const pet = await this.pool.query<PetRow>(query, [id]);
        return pet.rows[0];
    }
}