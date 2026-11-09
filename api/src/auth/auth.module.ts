import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Env } from '../config/env';
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>) => ({
                secret: config.get("JWT_SECRET", { infer: true }),
                signOptions: { expiresIn: "1h" }
            }),
        })
    ],
    controllers: [AuthController],
    providers: [AuthRepository, AuthService, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard, JwtModule],
})

export class AuthModule { }