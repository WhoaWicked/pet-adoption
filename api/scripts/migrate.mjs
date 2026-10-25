// Wrapper around the node-pg-migrate CLI: `node scripts/migrate.mjs <up|down|create> [args]`.
//
// node-pg-migrate only understands DATABASE_URL, but the API (and docker compose)
// read DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD from api/.env. This script
// builds DATABASE_URL from those same variables so there is a single source of truth.
// The check below mirrors the rules in src/config/env.ts; it is duplicated on purpose
// because an .mjs script cannot import the TypeScript file.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Usage: node scripts/migrate.mjs <up|down|create> [args]');
  process.exit(1);
}

const cliArgs = [command, ...args, '-m', 'migrations'];

if (command === 'create') {
  // New migrations are always plain .sql files.
  cliArgs.push('-j', 'sql');
} else {
  // loadEnvFile never overrides variables that are already set, so values from
  // the real environment (e.g. CI) win over api/.env. A missing file is fine.
  try {
    process.loadEnvFile(resolve(apiDir, '.env'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Report names only, never values, so DB_PASSWORD cannot leak.
  const problems = REQUIRED.filter((key) => !process.env[key]?.trim());
  const port = Number(process.env.DB_PORT);
  if (!problems.includes('DB_PORT') && !(Number.isInteger(port) && port >= 1 && port <= 65535)) {
    problems.push('DB_PORT');
  }
  if (problems.length > 0) {
    console.error(
      `Missing or invalid environment variables: ${problems.join(', ')}.\n` +
        'Create api/.env from api/.env.example (or set them in the environment).',
    );
    process.exit(1);
  }

  // encodeURIComponent keeps characters like # $ @ : / in the password from
  // being read as URL syntax.
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  process.env.DATABASE_URL =
    `postgres://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}` +
    `@${DB_HOST}:${DB_PORT}/${encodeURIComponent(DB_NAME)}`;
}

// Run the CLI with the current Node binary instead of a .cmd shim (Windows-safe).
const cli = fileURLToPath(import.meta.resolve('node-pg-migrate/bin/node-pg-migrate'));
const result = spawnSync(process.execPath, [cli, ...cliArgs], {
  cwd: apiDir,
  env: process.env,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
