import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePetInput, PetRow, PetsRepository } from "./pets.repository";

export interface ListPetsInput {
    species?: 'dog' | 'cat' | 'other';
    province?: string;
    limit?: number;
    offset?: number
}
export interface PagedPets {
    data: PetRow[];
    meta: { total: number, limit: number, offset: number }
}

@Injectable()
export class PetsService {
    constructor(private readonly petsRepository: PetsRepository) { }
    async create(input: CreatePetInput): Promise<PetRow> {
        const newPet = await this.petsRepository.create(input);
        return newPet
    }
    async findById(id: string): Promise<PetRow> {
        const pet = await this.petsRepository.findById(id);
        if (!pet) {
            throw new NotFoundException("Not found a pet");
        }
        return pet;
    }
    async findAll(input: ListPetsInput): Promise<PagedPets> {
        const { species, province, limit = 20, offset = 0 } = input;
        const { rows, total } = await this.petsRepository.findAvailable({ species, province }, limit, offset);
        return {
            data: rows,
            meta: { total, limit, offset, }
        }
    }
}