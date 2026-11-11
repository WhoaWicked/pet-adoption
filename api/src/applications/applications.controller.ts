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
}