import { ConflictException, ForbiddenException } from "@nestjs/common";
import { PetsRepository } from "./pets.repository";
import { PetsService } from "./pets.service";

describe('PetsService', () => {
    const findById = jest.fn();
    const close = jest.fn();
    const service = new PetsService({ findById, close } as unknown as PetsRepository);
    beforeEach(() => {
        findById.mockReset();
        close.mockReset();
    });
    it('close rejects when the user is not the owner', async () => {
        findById.mockResolvedValue({ id: 'p1', owner_id: 'owner-1', status: 'available' });
        await expect(service.close('p1', 'someone-else')).rejects.toThrow(ForbiddenException);
        expect(close).not.toHaveBeenCalled();
    });
    it('close closes the pet for the owner', async () => {
        findById.mockResolvedValue({ id: 'p1', owner_id: 'owner-1', status: 'available' });
        close.mockResolvedValue({ id: 'p1', owner_id: 'owner-1', status: 'closed' });
        const result = await service.close('p1', 'owner-1');
        expect(result.status).toBe('closed');
        expect(close).toHaveBeenCalledWith('p1');
    });
    it('close rejects when the pet is already adopted', async () => {
        findById.mockResolvedValue({ id: 'p1', owner_id: 'owner-1', status: 'adopted' });
        await expect(service.close('p1', 'owner-1')).rejects.toThrow(ConflictException);
        expect(close).not.toHaveBeenCalled();
    });
})