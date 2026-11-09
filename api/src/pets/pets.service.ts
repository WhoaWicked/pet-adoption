import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePetInput, PetRow, PetsRepository } from "./pets.repository";

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
}