import { IsEmail, MinLength, IsString, IsNotEmpty } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string

    @IsString()
    @MinLength(8)
    password: string

    @IsString()
    @IsNotEmpty()
    displayName: string
}