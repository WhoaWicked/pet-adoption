import { validateEnv } from './env';

const validRaw = {
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'pet_adoption',
  DB_USER: 'pet_user',
  DB_PASSWORD: 'p@ss:w/rd#1$x',
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
});
