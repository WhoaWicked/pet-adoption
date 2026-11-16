import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationRow, NotificationsRepository } from "./notifications.repository";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";

export interface PagedNotifications {
    data: NotificationRow[];
    meta: { total: number; limit: number; offset: number };
}

@Injectable()
export class NotificationsService {
    constructor(private readonly notificationsRepository: NotificationsRepository) { }

    async listMine(userId: string, query: ListNotificationsQueryDto): Promise<PagedNotifications> {
        const limit = query.limit ?? 20;
        const offset = query.offset ?? 0;
        const { rows, total } = await this.notificationsRepository.findMine(userId, limit, offset);
        return { data: rows, meta: { total, limit, offset } };
    }

    async unreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.notificationsRepository.countUnread(userId);
        return { count };
    }

    async markRead(id: number, userId: string): Promise<NotificationRow> {
        const notification = await this.notificationsRepository.markRead(id, userId);
        if (!notification) {
            throw new NotFoundException("Notification not found");
        }
        return notification;
    }
}
