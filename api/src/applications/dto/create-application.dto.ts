import { Type } from "class-transformer";
import { IsObject, IsUUID, ValidateNested } from "class-validator";
import { AnswersDto } from "./answers.dto";

export class CreateApplicationDto {
    @IsUUID()
    petId: string

    @ValidateNested()
    @IsObject()
    @Type(() => AnswersDto)
    answers: AnswersDto
}