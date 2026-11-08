import { Body, Post, Controller, UseGuards, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { type AuthenticateRequest, JwtAuthGuard } from "./jwt-auth.guard";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto.email, dto.password, dto.displayName);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() request: AuthenticateRequest) {
        return request.user;
    }


}