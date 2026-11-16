import { Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticateRequest } from "../auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async listMine(@Query() query: ListNotificationsQueryDto, @Req() req: AuthenticateRequest) {
        return this.notificationsService.listMine(req.user!.id, query);
    }

    @Get('unread-count')
    async unreadCount(@Req() req: AuthenticateRequest) {
        return this.notificationsService.unreadCount(req.user!.id);
    }

    @Patch(':id/read')
    async markRead(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticateRequest) {
        return this.notificationsService.markRead(id, req.user!.id);
    }
}
