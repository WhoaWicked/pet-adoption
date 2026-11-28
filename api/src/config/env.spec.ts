import { validateEnv } from './env';

const validRaw = {
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'pet_adoption',
  DB_USER: 'pet_user',
  DB_PASSWORD: 'p@ss:w/rd#1$x',
  JWT_SECRET: 'test-jwt-secret',
  GEMINI_API_KEY: 'fake-gemini-key-123',
  AI_MODEL: 'fake-model',
};

describe('validateEnv', () => {
  it('returns typed values when every required variable is present', () => {
    expect(validateEnv(validRaw)).toEqual({
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'pet_adoption',
      DB_USER: 'pet_user',
      DB_PASSWORD: 'p@ss:w/rd#1$x',
      JWT_SECRET: 'test-jwt-secret',
      GEMINI_API_KEY: 'fake-gemini-key-123',
      AI_MODEL: 'fake-model',
    });
  });

  it('throws a clear error naming every missing or invalid variable', () => {
    const raw: Record<string, unknown> = {
      ...validRaw,
      DB_HOST: '',
      DB_PORT: 'abc',
    };
    delete raw.DB_USER;

    expect(() => validateEnv(raw)).toThrow(/DB_HOST/);
    expect(() => validateEnv(raw)).toThrow(/DB_USER/);
    expect(() => validateEnv(raw)).toThrow(/DB_PORT/);
  });

  it('never includes the password in the error message', () => {
    const raw = { ...validRaw, DB_PORT: '99999' };

    expect(() => validateEnv(raw)).toThrow(/DB_PORT/);
    expect(() => validateEnv(raw)).not.toThrow(/p@ss/);
  });

  it('defaults PORT to 3000 when unset, but still rejects an invalid one', () => {
    const raw: Record<string, unknown> = { ...validRaw };
    delete raw.PORT;

    expect(validateEnv(raw).PORT).toBe(3000);
    expect(() => validateEnv({ ...validRaw, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('leaves the pool and CORS settings unset when they are missing or blank', () => {
    const env = validateEnv({
      ...validRaw,
      DB_POOL_MAX: '',
      DB_CONNECTION_TIMEOUT_MS: '  ',
      CORS_ORIGIN: '',
    });

    expect(env.DB_POOL_MAX).toBeUndefined();
    expect(env.DB_CONNECTION_TIMEOUT_MS).toBeUndefined();
    expect(env.CORS_ORIGIN).toBeUndefined();
  });

  it('parses the pool settings as positive integers', () => {
    const env = validateEnv({
      ...validRaw,
      DB_POOL_MAX: '5',
      DB_CONNECTION_TIMEOUT_MS: '10000',
    });

    expect(env.DB_POOL_MAX).toBe(5);
    expect(env.DB_CONNECTION_TIMEOUT_MS).toBe(10000);
  });

  it.each(['0', '-1', '1.5', 'abc'])(
    'rejects %s as a pool setting',
    (value) => {
      expect(() => validateEnv({ ...validRaw, DB_POOL_MAX: value })).toThrow(
        /DB_POOL_MAX/,
      );
      expect(() =>
        validateEnv({ ...validRaw, DB_CONNECTION_TIMEOUT_MS: value }),
      ).toThrow(/DB_CONNECTION_TIMEOUT_MS/);
    },
  );

  it('splits CORS_ORIGIN into origins without trailing slashes', () => {
    const env = validateEnv({
      ...validRaw,
      CORS_ORIGIN: 'https://web.example.com/, http://localhost:5173',
    });

    expect(env.CORS_ORIGIN).toEqual([
      'https://web.example.com',
      'http://localhost:5173',
    ]);
  });

  it.each([
    '*',
    'https://*.example.com',
    'web.example.com',
    'https://web.example.com/pets',
    'ftp://web.example.com',
    'https://ok.example.com,*',
    ',',
  ])('rejects %s as CORS_ORIGIN', (value) => {
    expect(() => validateEnv({ ...validRaw, CORS_ORIGIN: value })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('names GEMINI_API_KEY and AI_MODEL when they are missing or empty', () => {
    const raw: Record<string, unknown> = { ...validRaw, AI_MODEL: '   ' };
    delete raw.GEMINI_API_KEY;

    expect(() => validateEnv(raw)).toThrow(/GEMINI_API_KEY/);
    expect(() => validateEnv(raw)).toThrow(/AI_MODEL/);
  });

  it('never includes the Gemini key or model name in the error message', () => {
    const raw = { ...validRaw, AI_MODEL: '' };

    expect(() => validateEnv(raw)).toThrow(/AI_MODEL/);
    expect(() => validateEnv(raw)).not.toThrow(/fake-gemini-key-123/);
    expect(() => validateEnv({ ...validRaw, GEMINI_API_KEY: '' })).not.toThrow(/fake-model/);
  });
});
