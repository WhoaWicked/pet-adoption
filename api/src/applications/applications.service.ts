import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PetsService } from "../pets/pets.service";
import { ApplicationAnswers, ApplicationRow, ApplicationsRepository } from './applications.repository';

@Injectable()
export class ApplicationsService {
    constructor(
        private readonly applicationsRepository: ApplicationsRepository,
        private readonly petsService: PetsService,
    ) { }
    async create(petId: string, applicantId: string, answers: ApplicationAnswers): Promise<ApplicationRow> {
        const pet = await this.petsService.findById(petId);
        if (pet.owner_id === applicantId) {
            throw new ForbiddenException("You cannot apply to your own pet");
        }
        if (pet.status !== 'available') {
            throw new ConflictException("Pet is not available");
        }
        const application = await this.applicationsRepository.create(petId, applicantId, answers);
        if (!application) {
            throw new ConflictException("You already applied to this pet");
        }
        return application;
    }
    async withdraw(id: string, userId: string): Promise<ApplicationRow> {
        const application = await this.applicationsRepository.findById(id);
        if (!application) {
            throw new NotFoundException("Application not found");
        }
        if (application.applicant_id !== userId) {
            throw new ForbiddenException("You do not own this application");
        }
        if (application.status === 'withdrawn') {
            return application;
        }
        if (application.status !== 'pending') {
            throw new ConflictException("Only pending applications can be withdrawn");
        }
        const result = await this.applicationsRepository.withdraw(id);
        if (!result) {
            throw new ConflictException("Application cannot be withdrawn");
        }
        return result;
    }
}