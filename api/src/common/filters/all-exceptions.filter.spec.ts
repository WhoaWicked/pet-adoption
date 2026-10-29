import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe("AllExceptionsFilter", () => {
    let json: jest.Mock;
    let status: jest.Mock;
    let host: ArgumentsHost;
    const filter = new AllExceptionsFilter();
    beforeEach(() => {
        json = jest.fn();
        status = jest.fn().mockReturnValue({ json });
        host = {
            switchToHttp: () => ({ getResponse: () => ({ status }) }),
        } as unknown as ArgumentsHost;
    });
    it('keep the status of an HttpException', () => {
        filter.catch(new NotFoundException(), host);
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({
            error: "NOT_FOUND",
            message: "Not Found",
            statusCode: 404,
        });
    });
    it('maps pg unique violation to 409', () => {
        const pgError = Object.assign(new Error('duplicate key value violates ...'), { code: '23505' });
        filter.catch(pgError, host);
        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({
            error: "CONFLICT",
            message: "Resource already exists",
            statusCode: 409,
        });
    });
    it('returns 500 without stack for plain Error', () => {
        filter.catch(new Error("boom"), host);
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error",
            statusCode: 500,
        });
    });

});