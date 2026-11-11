import { Type } from "class-transformer"
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator"

export class ListMineQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    @Type(() => Number)
    limit?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    offset?: number
}