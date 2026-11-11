import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PetsRepository } from "./pets.repository";
import { PetsService } from "./pets.service";
import { PetsController } from "./pets.controller";

@Module({
    imports: [AuthModule],
    providers: [PetsRepository, PetsService],
    controllers: [PetsController],
    exports: [PetsService],
})

export class PetsModule { }