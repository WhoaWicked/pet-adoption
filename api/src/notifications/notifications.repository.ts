import { Inject, Injectable } from "@nestjs/common";
import { Pool, PoolClient } from "pg";
import { PG_POOL } from "../database/database.constants";

export interface NotificationRow {
    // BIGSERIAL: pg returns it as a string, so it stays a string in responses.
    id: string;
    user_id: string;
    type: string;
    entity_id: string;
    message: string;
    read_at: Date | null;
    created_at: Date;
}

export interface NotificationListResult {
    rows: NotificationRow[];
    total: number;
}

export interface CreateNotificationInput {
    userId: string;
    type: string;
    entityId: string;
    message: string;
}

@Injectable()
export class NotificationsRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }

    async findMine(userId: string, limit: number, offset: number): Promise<NotificationListResult> {
        const countQuery = `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1;`;
        const listQuery = `SELECT * FROM notifications WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2 OFFSET $3;`;
        const count = await this.pool.query<{ total: number }>(countQuery, [userId]);
        const result = await this.pool.query<NotificationRow>(listQuery, [userId, limit, offset]);
        return { rows: result.rows, total: count.rows[0].total };
    }

    async countUnread(userId: string): Promise<number> {
        const query = `SELECT COUNT(*)::int AS count FROM notifications
        WHERE user_id = $1 AND read_at IS NULL;`;
        const result = await this.pool.query<{ count: number }>(query, [userId]);
        return result.rows[0].count;
    }

    // COALESCE keeps the original read_at, so marking twice is a harmless no-op.
    // Not found and not owned both return no row (the service turns that into 404).
    async markRead(id: number, userId: string): Promise<NotificationRow | undefined> {
        const query = `UPDATE notifications SET read_at = COALESCE(read_at, now())
        WHERE id = $1 AND user_id = $2 RETURNING *;`;
        const result = await this.pool.query<NotificationRow>(query, [id, userId]);
        return result.rows[0];
    }
    async create(client: PoolClient, input: CreateNotificationInput): Promise<void> {
        const query = `INSERT INTO notifications (user_id, type, entity_id, message)
        VALUES ($1, $2, $3, $4)`;
        await client.query(query, [input.userId, input.type, input.entityId, input.message]);
        return;
    }
}
