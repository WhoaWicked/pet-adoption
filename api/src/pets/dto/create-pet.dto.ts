import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreatePetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['dog', 'cat', 'other'])
    species: 'dog' | 'cat' | 'other';

    @IsNotEmpty()
    @Min(0)
    @IsInt()
    ageMonths: number;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    requirements: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}