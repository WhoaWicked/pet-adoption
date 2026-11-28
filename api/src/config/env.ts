export interface Env {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  // Optional: absent when DB_SSL is unset, which means no SSL.
  DB_SSL?: boolean;
  // Optional pool tuning: DatabaseModule supplies the defaults when unset.
  DB_POOL_MAX?: number;
  DB_CONNECTION_TIMEOUT_MS?: number;
  // Optional: absent when CORS_ORIGIN is unset, which leaves CORS off.
  CORS_ORIGIN?: string[];
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
// Used when PORT is unset. Hosts such as Vercel do not require us to set one.
const DEFAULT_PORT = '3000';
const POSITIVE_INTEGER_KEYS = [
  'DB_POOL_MAX',
  'DB_CONNECTION_TIMEOUT_MS',
] as const;

function isBlank(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && !value.trim());
}

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return undefined;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : undefined;
}

function parsePort(value: unknown): number | undefined {
  const port = parsePositiveInteger(value);
  return port !== undefined && port <= 65535 ? port : undefined;
}

// Accepts exactly what a browser sends in the Origin header: scheme, host and
// optional port. A trailing slash is tolerated; paths and wildcards are not.
function parseOrigin(value: string): string | undefined {
  if (value.includes('*') || !URL.canParse(value)) return undefined;
  const url = new URL(value);
  const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
  return isWeb && url.href === `${url.origin}/` ? url.origin : undefined;
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
    const value = key === 'PORT' && isBlank(raw[key]) ? DEFAULT_PORT : raw[key];
    const port = parsePort(value);
    if (port === undefined) {
      problems.push(`${key} must be an integer between 1 and 65535`);
    } else {
      env[key] = port;
    }
  }

  for (const key of POSITIVE_INTEGER_KEYS) {
    if (isBlank(raw[key])) continue;
    const number = parsePositiveInteger(raw[key]);
    if (number === undefined) {
      problems.push(`${key} must be a positive integer`);
    } else {
      env[key] = number;
    }
  }

  // Comma-separated list. "*" is rejected so production can never be opened to
  // every website by accident.
  if (!isBlank(raw.CORS_ORIGIN)) {
    const items = String(raw.CORS_ORIGIN)
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
    const origins = items
      .map(parseOrigin)
      .filter((origin) => origin !== undefined);
    if (items.length === 0 || origins.length !== items.length) {
      problems.push(
        'CORS_ORIGIN must be a comma-separated list of origins like https://host (no path, no "*")',
      );
    } else {
      env.CORS_ORIGIN = origins;
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
