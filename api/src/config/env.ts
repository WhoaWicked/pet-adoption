export interface Env {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  // Optional: absent when DB_SSL is unset, which means no SSL.
  DB_SSL?: boolean;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  AI_MODEL: string;
}

const STRING_KEYS = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'AI_MODEL',
] as const;
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
// only reports variable names, never values, so secrets like DB_PASSWORD,
// JWT_SECRET and GEMINI_API_KEY cannot leak.
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

  // Anything other than true/false is rejected, so a typo cannot silently
  // leave SSL off.
  const dbSsl = typeof raw.DB_SSL === 'string' ? raw.DB_SSL.trim() : raw.DB_SSL;
  if (dbSsl !== undefined && dbSsl !== '') {
    if (dbSsl === 'true' || dbSsl === 'false') {
      env.DB_SSL = dbSsl === 'true';
    } else {
      problems.push('DB_SSL must be "true" or "false"');
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration (check api/.env):\n- ${problems.join('\n- ')}`,
    );
  }

  return env as Env;
}
