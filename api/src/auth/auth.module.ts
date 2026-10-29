import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Env } from '../config/env';
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

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
    providers: [AuthRepository, AuthService],
    exports: [AuthService],
})

export class AuthModule { }