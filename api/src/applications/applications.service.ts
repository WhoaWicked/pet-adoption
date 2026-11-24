import { BadGatewayException, ConflictException, ForbiddenException, GatewayTimeoutException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PetsService } from "../pets/pets.service";
import { ApplicationAnswers, ApplicationRow, ApplicationsRepository, MyApplicationRow, PetsApplicationRow } from './applications.repository';
import { AI_CLIENT } from "../ai/ai.constants";
import { type AiClient } from "../ai/ai-client.interface";
import { AiSummariesRepository } from "../ai/ai-summaries.repository";
import { AiSummary, SummaryAnswers } from "../ai/summary.types";
import { buildSummaryPrompt } from "../ai/summary-prompt";
import { AiAbortedError, AiError, AiInvalidResponseError, AiProviderError } from "../ai/ai.errors";
import { parseSummary } from "../ai/summary-parser";

export interface PagedApplications {
    data: MyApplicationRow[];
    meta: { total: number, limit: number, offset: number };
}

export interface SummaryResult {
    summary: AiSummary;
    updated_at: Date
}

const AI_TIMEOUT_MS = 15000;

@Injectable()
export class ApplicationsService {
    constructor(
        private readonly applicationsRepository: ApplicationsRepository,
        private readonly petsService: PetsService,
        @Inject(AI_CLIENT) private readonly aiClient: AiClient,
        private readonly aiSummariesRepository: AiSummariesRepository,
    ) { }
    async create(petId: string, applicantId: string, answers: ApplicationAnswers): Promise<ApplicationRow> {
        const pet = await this.petsService.findById(petId);
        if (pet.owner_id === applicantId) {
            throw new ForbiddenException("You cannot apply to your own pet");
        }
        if (pet.status !== 'available') {
            throw new ConflictException("Pet is not available");
        }
        const application = await this.applicationsRepository.create(petId, applicantId, answers, pet.owner_id);
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
    async listMine(applicantId: string, limit = 20, offset = 0): Promise<PagedApplications> {
        const { rows, total } = await this.applicationsRepository.findMine(applicantId, limit, offset);
        return { data: rows, meta: { total, limit, offset } };
    }
    async reject(id: string, userId: string): Promise<ApplicationRow> {
        const application = await this.applicationsRepository.findById(id);
        if (!application) {
            throw new NotFoundException("Application not found");
        }
        const pet = await this.petsService.findById(application.pet_id);
        if (pet.owner_id !== userId) {
            throw new ForbiddenException("You do not own this pet");
        }
        if (application.status !== 'pending') {
            throw new ConflictException("Only pending applications can be rejected");
        }
        const result = await this.applicationsRepository.reject(id);
        if (!result) {
            throw new ConflictException("Application cannot be rejected");
        }
        return result;
    }
    async listByPet(petId: string, userId: string): Promise<{ data: PetsApplicationRow[] }> {
        const pet = await this.petsService.findById(petId);
        if (pet.owner_id !== userId) {
            throw new ForbiddenException("You do not own this pet");
        }
        const result = await this.applicationsRepository.findByPet(petId);
        return { data: result }
    }
    async approve(id: string, userId: string): Promise<ApplicationRow> {
        const application = await this.applicationsRepository.findById(id);
        if (!application) {
            throw new NotFoundException("Application not found");
        }
        const pet = await this.petsService.findById(application.pet_id);
        if (pet.owner_id !== userId) {
            throw new ForbiddenException("You do not own this pet");
        }
        if (application.status !== 'pending') {
            throw new ConflictException("Only pending applications can be approved");
        }
        const result = await this.applicationsRepository.approve(id, pet.id);
        if (!result) {
            throw new ConflictException("Application cannot be approved");
        }
        return result;
    }
    async summarize(id: string, userId: string): Promise<SummaryResult> {
        const application = await this.applicationsRepository.findById(id);
        if (!application) {
            throw new NotFoundException("Application not found");
        }  
        const pet = await this.petsService.findById(application.pet_id);
        if (pet.owner_id !== userId) {
            throw new ForbiddenException("You do not own this pet");
        }
         if (application.status !== 'pending') {
            throw new ConflictException('Application must be pending');
        }
        const existingSummaries = await this.aiSummariesRepository.findByApplicationId(id);
        if (existingSummaries && (existingSummaries.status === 'done') && existingSummaries.summary) {
            return {
                summary: existingSummaries.summary,
                updated_at: existingSummaries.updated_at
            }
        }
        const prompt = buildSummaryPrompt(application.answers);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
        let raw: string;
        try {
            raw = await this.aiClient.generate(prompt, controller.signal);
        } catch (err) {
            if (err instanceof AiAbortedError) {
                throw new GatewayTimeoutException('Took too long')
            }
            if (err instanceof AiProviderError) {
                throw new ServiceUnavailableException('Try again later')
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
        let result: AiSummary;
        try {
            result = parseSummary(raw);
        } catch (err) {
            if (err instanceof AiInvalidResponseError) {
                throw new BadGatewayException('Bad gateway')
            }
            throw err;
        }
        const saved = await this.aiSummariesRepository.upsert({
            applicationId: application.id,
            status: 'done',
            summary: result,
            attempts: 1,
        })
        return {
            summary: result,
            updated_at: saved.updated_at,
        }
    }
}