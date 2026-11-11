import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class AnswersDto {
    @IsIn(['house', 'condo', 'apartment', 'other'])
    housingType: 'house' | 'condo' | 'apartment' | 'other'

    @IsBoolean()
    hasPetExperience: boolean

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string
}