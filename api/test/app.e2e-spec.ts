import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PG_POOL } from './../src/database/database.constants';
import { HealthModule } from './../src/health/health.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('GET /health (e2e)', () => {
  let app: INestApplication<App>;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();
    // HealthModule + fake pool: runs without Postgres or a .env file.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
      providers: [
        {
          provide: APP_FILTER,
          useClass: AllExceptionsFilter
        }
      ]
    })
      .useMocker((token) => (token === PG_POOL ? { query } : undefined))
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 when the database is reachable', () => {
    query.mockResolvedValue({ rows: [] });

    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('returns 503 when the database is down', () => {
    query.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    return request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect({ statusCode: 503, error: 'SERVICE_UNAVAILABLE', message: 'Service Unavailable Exception' });
  });
  it('returns 404 in the common error format for unknown routes', () => {
    return request(app.getHttpServer())
      .get('/abc')
      .expect(404)
      .expect({
        statusCode: 404,
        error: "NOT_FOUND",
        message: "Cannot GET /abc"
      })
  });
});
