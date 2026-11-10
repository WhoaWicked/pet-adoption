import { PetsService } from "./pets.service";
import { CreatePetDto } from "./dto/create-pet.dto";
import { JwtAuthGuard, type AuthenticateRequest } from "../auth/jwt-auth.guard";
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CreatePetInput } from "./pets.repository";
import { ListPetsQueryDto } from "./dto/list-pets-query.dto";

@Controller('pets')
export class PetsController {
    constructor(private readonly petsService: PetsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() dto: CreatePetDto, @Req() req: AuthenticateRequest) {
        const input: CreatePetInput = {
            ...dto,
            ownerId: req.user!.id,
        }
        return this.petsService.create(input);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.petsService.findById(id);
    }
    @Get()
    async findAll(@Query() query: ListPetsQueryDto) {
        return this.petsService.findAll(query);
    }
}