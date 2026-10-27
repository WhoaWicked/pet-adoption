import { ArgumentsHost, ExceptionFilter, Catch, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

const ERROR_CODES: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    500: "INTERNAL_SERVER_ERROR",
    503: "SERVICE_UNAVAILABLE",
};

function extractValidationDetails(exception: unknown): string[] | undefined {
    const error = exception instanceof HttpException ? exception.getResponse() : undefined;
    if (typeof error === "object" && error !== null) {
        if ("message" in error && Array.isArray(error.message)) {
            return error.message;
        }
    }
    return undefined;
}

function getPgErrorCode(exception: unknown): string | undefined {
    if (exception instanceof Error && "code" in exception) {
        if (typeof exception.code === "string") {
            return exception.code;
        }
    }
    return undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const pgCode = getPgErrorCode(exception);
        let status: number;
        let message: string;
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        } else if (pgCode === "23505") {
            status = 409;
            message = "Resource already exists"
        } else if (pgCode === "23514") {
            status = 400;
            message = "Invalid data";
        } else if (pgCode === "23503") {
            status = 409;
            message = "Operation conflicts with related data";
        }
        else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Internal Server Error";
        }
        const details = extractValidationDetails(exception);
        let error = ERROR_CODES[status]
        if (!error) {
            if (status < 500) {
                error = ERROR_CODES[400]
            }
            else {
                error = ERROR_CODES[500]
            }
        }
        const body: Record<string, unknown> = { statusCode: status, error, message };
        if (details) {
            body.error = "VALIDATION_FAILED"
            body.message = "Validation failed"
            body.details = details;
        }
        response.status(status).json(body);
    }
}