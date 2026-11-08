import { UnauthorizedException } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { hashPassword } from "./password";

describe('AuthService', () => {
    const createUser = jest.fn();
    const findByEmail = jest.fn();
    const signAsync = jest.fn();
    const service = new AuthService(
        { createUser, findByEmail } as unknown as AuthRepository,
        { signAsync } as unknown as JwtService,
    );
    beforeEach(() => {
        createUser.mockReset();
        findByEmail.mockReset();
        signAsync.mockReset();
    });
    it('register hashes the password before saving', async () => {
        createUser.mockResolvedValue({
            id: '1',
            email: "a@b.com",
            display_name: "test",
        });
        const newUser = await service.register("a@b.com", "secret123", "test");
        const savedHash = createUser.mock.calls[0][1];
        expect(savedHash).not.toBe('secret123');
        expect(savedHash).toMatch(/^\$2/);
        expect(newUser).toEqual({
            id: '1',
            email: "a@b.com",
            display_name: "test",
        })
    });
    it('login rejects an unknown email', async () => {
        findByEmail.mockResolvedValue(undefined);
        await expect(service.login("a@b.com", "secret123")).rejects.toThrow(UnauthorizedException);
    });
    it('login rejects a wrong password', async () => {
        findByEmail.mockResolvedValue({
            id: '1',
            email: 'a@b.com',
            password_hash: await hashPassword('right-password'),
        });
        await expect(service.login("a@b.com", "wrong-password")).rejects.toThrow(UnauthorizedException);
    });
    it('login returns an access token for valid credentials', async () => {
        findByEmail.mockResolvedValue({
            id: '1',
            email: 'a@b.com',
            password_hash: await hashPassword('right-password'),
        });
        signAsync.mockResolvedValue('fake-token');
        const result = await service.login("a@b.com", "right-password");
        expect(result).toEqual({ accessToken: 'fake-token' });
        expect(signAsync).toHaveBeenCalledWith({ sub: "1" });
    });
});