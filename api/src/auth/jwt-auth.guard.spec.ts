import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe('JwtAuthGuard', () => {
    const verifyAsync = jest.fn();
    const guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService);
    beforeEach(() => verifyAsync.mockReset());
    function contextWith(request: object): ExecutionContext {
        return {
            switchToHttp: () => ({ getRequest: () => request })
        } as unknown as ExecutionContext
    }

    it('rejects when there is no authentication header', async () => {
        const result = guard.canActivate(contextWith({ headers: {} }));
        await expect(result).rejects.toThrow(UnauthorizedException);
    });
    it('rejects when the token is invalid', async () => {
        verifyAsync.mockRejectedValue(new Error('invalid'));
        const result = guard.canActivate(contextWith({ headers: { authorization: 'Bearer abc' } }));
        await expect(result).rejects.toThrow(UnauthorizedException);
        expect(verifyAsync).toHaveBeenCalledWith('abc');
    });
    it('allow a valid token and sets request.user', async () => {
        verifyAsync.mockResolvedValue({ sub: 'user-1' });
        const request: { headers: object, user?: { id: string } } = {
            headers: { authorization: 'Bearer abc' },
        };
        const result = await guard.canActivate(contextWith(request));
        expect(result).toBe(true);
        expect(request.user).toEqual({ id: 'user-1' });
    });
});