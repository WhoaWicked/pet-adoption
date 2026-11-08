import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

export type AuthenticateRequest = Request & { user?: { id: string } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticateRequest>();
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Unauthorized');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request.user = { id: payload.sub }
        } catch {
            throw new UnauthorizedException('Unauthorized');
        }
        return true;
    }
}