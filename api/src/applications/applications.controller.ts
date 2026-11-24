import { Body, Controller, Get, Post, Patch, UseGuards, Query, Req, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard, type AuthenticateRequest } from "../auth/jwt-auth.guard";
import { ListMineQueryDto } from "./dto/list-mine-query.dto";
import { CreateApplicationDto } from "./dto/create-application.dto";

@Controller('applications')
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('mine')
    async listMine(@Query() query: ListMineQueryDto, @Req() req: AuthenticateRequest) {
        const { limit, offset } = query;
        return this.applicationsService.listMine(req.user!.id, limit, offset);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() body: CreateApplicationDto, @Req() req: AuthenticateRequest) {
        const { petId, answers } = body;
        return this.applicationsService.create(petId, req.user!.id, answers);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/withdraw')
    async withdraw(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.applicationsService.withdraw(id, req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/reject')
    async reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.applicationsService.reject(id, req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('pet/:petId')
    async listByPet(@Param('petId', ParseUUIDPipe) petId: string, @Req() req: AuthenticateRequest) {
        return this.applicationsService.listByPet(petId, req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/approve')
    async approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.applicationsService.approve(id, req.user!.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/summary')
    async summary(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
        return this.applicationsService.summarize(id, req.user!.id);
    }
}