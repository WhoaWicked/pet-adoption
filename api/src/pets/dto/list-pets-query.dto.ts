import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListPetsQueryDto {
    @IsIn(['dog', 'cat', 'other'])
    @IsOptional()
    species?: 'dog' | 'cat' | 'other'

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    province?: string

    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    @Type(() => Number)
    limit?: number

    @IsInt()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number
}