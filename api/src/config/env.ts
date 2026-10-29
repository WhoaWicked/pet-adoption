export interface Env {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
}

const STRING_KEYS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'] as const;
const PORT_KEYS = ['PORT', 'DB_PORT'] as const;

function parsePort(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return undefined;
  }
  const port = Number(value);
  return port >= 1 && port <= 65535 ? port : undefined;
}

// Validates raw environment variables once at startup. It collects every
// problem into a single error so the developer can fix them in one go, and it
// only reports variable names, never values, so DB_PASSWORD and JWT_SECRET cannot leak.
export function validateEnv(raw: Record<string, unknown>): Env {
  const problems: string[] = [];
  const env: Partial<Env> = {};

  for (const key of STRING_KEYS) {
    const value = raw[key];
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`${key} is missing or empty`);
    } else {
      env[key] = value;
    }
  }

  for (const key of PORT_KEYS) {
    const port = parsePort(raw[key]);
    if (port === undefined) {
      problems.push(`${key} must be an integer between 1 and 65535`);
    } else {
      env[key] = port;
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration (check api/.env):\n- ${problems.join('\n- ')}`,
    );
  }

  return env as Env;
}
