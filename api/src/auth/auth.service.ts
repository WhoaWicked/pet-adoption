import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthRepository, CreatedUser } from "./auth.repository";
import { comparePassword, hashPassword } from "./password";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async register(email: string, password: string, displayName: string): Promise<CreatedUser> {
        const hashedPassword = await hashPassword(password)
        const newUser = await this.authRepository.createUser(email, hashedPassword, displayName);
        return newUser;
    }

    async login(email: string, password: string): Promise<{ accessToken: string }> {
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException("Invalid email or password");
        }
        if (!(await comparePassword(password, user.password_hash))) {
            throw new UnauthorizedException("Invalid email or password");
        }
        const accessToken = await this.jwtService.signAsync({ sub: user.id });
        return { accessToken }
    }
}