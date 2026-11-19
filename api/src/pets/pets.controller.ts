import { PetsService } from "./pets.service";
import { CreatePetDto } from "./dto/create-pet.dto";
import { JwtAuthGuard, type AuthenticateRequest } from "../auth/jwt-auth.guard";
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
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

    @UseGuards(JwtAuthGuard)
    @Get('saved')
    async listSaved(@Req() req: AuthenticateRequest) {
        return this.petsService.listSaved(req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('mine')
    async listMine(@Req() req: AuthenticateRequest) {
        return this.petsService.listMine(req.user!.id);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.petsService.findById(id);
    }
    @Get()
    async findAll(@Query() query: ListPetsQueryDto) {
        return this.petsService.findAll(query);
    }
    @UseGuards(JwtAuthGuard)
    @Patch(':id/close')
    async close(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.petsService.close(id, req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id/save')
    async save(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.petsService.save(req.user!.id, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/save')
    async unsave(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.petsService.unsave(req.user!.id, id);
    }

}