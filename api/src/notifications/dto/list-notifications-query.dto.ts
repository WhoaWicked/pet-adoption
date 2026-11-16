import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsQueryDto {
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    @Type(() => Number)
    limit?: number

    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    offset?: number
}
