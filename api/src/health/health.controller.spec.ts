import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PG_POOL } from '../database/database.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: PG_POOL, useValue: { query } }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reports ok when the database query succeeds', async () => {
    query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('responds 503 when the database query fails, without leaking details', async () => {
    query.mockRejectedValue(
      new Error('password authentication failed for user "pet_user"'),
    );

    const error = await controller.check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    const body = (error as ServiceUnavailableException).getResponse();
    expect(body).toEqual({ status: 'error', database: 'down' });
    expect(JSON.stringify(body)).not.toMatch(/pet_user|password/);
  });

  it('responds 503 when the database query hangs past the timeout', async () => {
    jest.useFakeTimers();
    query.mockReturnValue(new Promise(() => {}));

    const result = controller.check().catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(2500);

    expect(await result).toBeInstanceOf(ServiceUnavailableException);
  });
});
