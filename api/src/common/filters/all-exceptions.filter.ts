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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException
            ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof HttpException
            ? exception.message : "Internal Server Error";
        let error = ERROR_CODES[status]
        if (!error) {
            if (status < 500) {
                error = ERROR_CODES[400]
            }
            else {
                error = ERROR_CODES[500]
            }
        }
        response.status(status).json({
            statusCode: status,
            error: error,
            message: message,
        });
    }
}