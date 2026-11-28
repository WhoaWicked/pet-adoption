// Demo seed: `node scripts/seed.mjs [--yes]` (npm run seed -- --yes).
//
// Fills the database with fake demo data from scripts/seed-data.json and one
// image URL per pet from scripts/seed-images.txt. Without --yes it only prints
// the target database and what it would do, then exits without connecting.
//
// Reset deletes only rows that belong to the seed users, found by the exact
// email list in seed-data.json, then inserts everything again. Reset and
// insert run in one transaction, so a failure leaves the database unchanged.
//
// The env loading and DB_* check mirror scripts/migrate.mjs on purpose: an .mjs
// script cannot import the TypeScript config.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(scriptsDir, '..');
const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

// Same cost as SALT_ROUNDS in src/auth/password.ts, so demo users log in
// through the normal auth flow.
const SALT_ROUNDS = 10;

// Values from the database schema and the API code this data must follow.
const SPECIES = ['dog', 'cat', 'other'];
const PET_STATUSES = ['available', 'adopted', 'closed'];
const APP_STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'];
const HOUSING_TYPES = ['house', 'condo', 'apartment', 'other'];
// Same messages the applications repository writes; the web shows Thai text by type.
const NOTIFICATION_MESSAGES = {
  'application.received': 'You received a new adoption application',
  'application.approved': 'Your adoption application was approved',
  'application.rejected': 'Your adoption application was not selected',
};
// Limits from src/ai/ai.constants.ts.
const MAX_OVERVIEW_LENGTH = 600;
const MAX_LIST_ITEMS = 5;
const MAX_ITEM_LENGTH = 200;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function fail(message) {
  console.error(`seed: ${message}`);
  process.exit(1);
}

// ---------- 1. Arguments ----------
const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== '--yes');
if (unknown.length > 0) {
  fail(`unknown argument(s): ${unknown.join(' ')}\nUsage: node scripts/seed.mjs [--yes]`);
}
const confirmed = args.includes('--yes');

// ---------- 2. Environment ----------
// loadEnvFile never overrides variables already set, so the real environment
// wins over api/.env. A missing file is fine.
try {
  process.loadEnvFile(resolve(apiDir, '.env'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

// Report names only, never values.
const problems = REQUIRED.filter((key) => !process.env[key]?.trim());
const port = Number(process.env.DB_PORT);
if (!problems.includes('DB_PORT') && !(Number.isInteger(port) && port >= 1 && port <= 65535)) {
  problems.push('DB_PORT');
}
// Optional; same rule as src/config/env.ts: unset means off.
const dbSsl = process.env.DB_SSL?.trim() ?? '';
if (!['', 'true', 'false'].includes(dbSsl)) {
  problems.push('DB_SSL');
}
const useSsl = dbSsl === 'true';
if (problems.length > 0) {
  fail(
    `missing or invalid environment variables: ${problems.join(', ')}.\n` +
      'Create api/.env from api/.env.example (or set them in the environment).',
  );
}
if (!process.env.DEMO_PASSWORD) {
  fail('DEMO_PASSWORD is not set. Set it in the environment (or api/.env) to the password for the demo accounts.');
}

// ---------- 3. Load and validate seed data ----------
const data = JSON.parse(readFileSync(resolve(scriptsDir, 'seed-data.json'), 'utf8'));
const images = readFileSync(resolve(scriptsDir, 'seed-images.txt'), 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line !== '');

// Collects every problem so one run shows all of them.
function validate({ users, pets, applications, notifications, aiSummary }) {
  const errors = [];
  const userByKey = new Map(users.map((u) => [u.key, u]));
  const petByKey = new Map(pets.map((p) => [p.key, p]));
  const appByKey = new Map(applications.map((a) => [a.key, a]));
  const isPositiveInt = (n) => Number.isInteger(n) && n >= 0;

  if (userByKey.size !== users.length) errors.push('users: duplicate key');
  if (new Set(users.map((u) => u.email)).size !== users.length) errors.push('users: duplicate email');
  for (const u of users) {
    if (!u.email?.endsWith('@example.com')) errors.push(`user ${u.key}: email must end with @example.com`);
    if (!u.displayName) errors.push(`user ${u.key}: displayName is empty`);
  }

  if (petByKey.size !== pets.length) errors.push('pets: duplicate key');
  if (images.length !== pets.length) {
    errors.push(`seed-images.txt has ${images.length} URLs but there are ${pets.length} pets`);
  }
  for (const p of pets) {
    if (!userByKey.has(p.ownerKey)) errors.push(`pet ${p.key}: unknown ownerKey ${p.ownerKey}`);
    if (!SPECIES.includes(p.species)) errors.push(`pet ${p.key}: invalid species ${p.species}`);
    if (!PET_STATUSES.includes(p.status)) errors.push(`pet ${p.key}: invalid status ${p.status}`);
    if (!isPositiveInt(p.ageMonths)) errors.push(`pet ${p.key}: ageMonths must be an integer >= 0`);
    if (!isPositiveInt(p.daysAgo)) errors.push(`pet ${p.key}: daysAgo must be an integer >= 0`);
    for (const field of ['name', 'province', 'description', 'requirements']) {
      if (!p[field]) errors.push(`pet ${p.key}: ${field} is empty`);
    }
  }

  if (appByKey.size !== applications.length) errors.push('applications: duplicate key');
  const pairs = new Set();
  for (const a of applications) {
    const pet = petByKey.get(a.petKey);
    if (!pet) { errors.push(`application ${a.key}: unknown petKey ${a.petKey}`); continue; }
    if (!userByKey.has(a.applicantKey)) errors.push(`application ${a.key}: unknown applicantKey ${a.applicantKey}`);
    if (!APP_STATUSES.includes(a.status)) errors.push(`application ${a.key}: invalid status ${a.status}`);
    if (pet.ownerKey === a.applicantKey) errors.push(`application ${a.key}: applicant owns the pet`);
    const pair = `${a.petKey}/${a.applicantKey}`;
    if (pairs.has(pair)) errors.push(`application ${a.key}: duplicate (pet, applicant)`);
    pairs.add(pair);
    if (['pending', 'withdrawn'].includes(a.status) && pet.status !== 'available') {
      errors.push(`application ${a.key}: ${a.status} application on a pet that is not available`);
    }
    if (a.status === 'approved' && pet.status !== 'adopted') {
      errors.push(`application ${a.key}: approved application on a pet that is not adopted`);
    }
    if (!isPositiveInt(a.daysAgo) || a.daysAgo > pet.daysAgo) {
      errors.push(`application ${a.key}: daysAgo must be an integer between 0 and the pet's daysAgo`);
    }
    const decided = ['approved', 'rejected'].includes(a.status);
    if (decided && !(isPositiveInt(a.decidedDaysAgo) && a.decidedDaysAgo <= a.daysAgo)) {
      errors.push(`application ${a.key}: decidedDaysAgo must be an integer between 0 and daysAgo`);
    }
    if (!decided && a.decidedDaysAgo !== undefined) {
      errors.push(`application ${a.key}: decidedDaysAgo is only for approved/rejected`);
    }
    const ans = a.answers ?? {};
    if (!HOUSING_TYPES.includes(ans.housingType)) errors.push(`application ${a.key}: invalid housingType`);
    if (typeof ans.hasPetExperience !== 'boolean') errors.push(`application ${a.key}: hasPetExperience must be boolean`);
    if (ans.note !== undefined && typeof ans.note !== 'string') errors.push(`application ${a.key}: note must be a string`);
    const extra = Object.keys(ans).filter((k) => !['housingType', 'hasPetExperience', 'note'].includes(k));
    if (extra.length > 0) errors.push(`application ${a.key}: unknown answer fields ${extra.join(', ')}`);
  }

  // An adopted pet has exactly one approved application; all its others are rejected.
  for (const p of pets.filter((pet) => pet.status === 'adopted')) {
    const apps = applications.filter((a) => a.petKey === p.key);
    const approved = apps.filter((a) => a.status === 'approved');
    if (approved.length !== 1) errors.push(`pet ${p.key}: adopted pet needs exactly 1 approved application`);
    if (apps.some((a) => !['approved', 'rejected'].includes(a.status))) {
      errors.push(`pet ${p.key}: other applications of an adopted pet must be rejected`);
    }
    const decided = new Set(apps.map((a) => a.decidedDaysAgo));
    if (decided.size > 1) errors.push(`pet ${p.key}: applications of an adopted pet must share decidedDaysAgo`);
  }

  for (const [i, n] of notifications.entries()) {
    const label = `notification #${i + 1}`;
    const app = appByKey.get(n.applicationKey);
    if (!app) { errors.push(`${label}: unknown applicationKey ${n.applicationKey}`); continue; }
    if (!(n.type in NOTIFICATION_MESSAGES)) { errors.push(`${label}: invalid type ${n.type}`); continue; }
    if (typeof n.read !== 'boolean') errors.push(`${label}: read must be boolean`);
    if (n.type === 'application.received') {
      if (n.userKey !== petByKey.get(app.petKey)?.ownerKey) errors.push(`${label}: received must go to the pet owner`);
    } else {
      if (n.userKey !== app.applicantKey) errors.push(`${label}: ${n.type} must go to the applicant`);
      if (n.type !== `application.${app.status}`) errors.push(`${label}: ${n.type} does not match application status ${app.status}`);
    }
  }

  const summaryApp = appByKey.get(aiSummary?.applicationKey);
  if (!summaryApp) {
    errors.push('aiSummary: unknown applicationKey');
  } else {
    if (summaryApp.status !== 'pending') errors.push('aiSummary: must belong to a pending application');
    if (petByKey.get(summaryApp.petKey)?.ownerKey !== 'owner') errors.push("aiSummary: must be on a demo-owner pet");
  }
  const s = aiSummary?.summary ?? {};
  if (typeof s.overview !== 'string' || s.overview.trim() === '' || s.overview.length > MAX_OVERVIEW_LENGTH) {
    errors.push(`aiSummary: overview must be a non-empty string of at most ${MAX_OVERVIEW_LENGTH} chars`);
  }
  for (const list of ['highlights', 'concerns']) {
    const items = s[list];
    if (!Array.isArray(items) || items.length > MAX_LIST_ITEMS ||
        items.some((x) => typeof x !== 'string' || x.trim() === '' || x.length > MAX_ITEM_LENGTH)) {
      errors.push(`aiSummary: ${list} must be at most ${MAX_LIST_ITEMS} non-empty strings of at most ${MAX_ITEM_LENGTH} chars`);
    }
  }
  const extraSummary = Object.keys(s).filter((k) => !['overview', 'highlights', 'concerns'].includes(k));
  if (extraSummary.length > 0) errors.push(`aiSummary: unknown fields ${extraSummary.join(', ')}`);

  for (const key of ['owner', 'adopter']) {
    if (!userByKey.has(key)) errors.push(`users: missing required key "${key}"`);
  }
  return errors;
}

const errors = validate(data);
if (errors.length > 0) {
  fail(`seed-data.json is invalid:\n  - ${errors.join('\n  - ')}`);
}

const emails = data.users.map((u) => u.email);

// ---------- 4. Guard ----------
// Host, port and database name only; never the user, password or a URL.
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
console.log(`Target database: ${DB_NAME} on ${DB_HOST}:${DB_PORT} (ssl ${useSsl ? 'on' : 'off'})`);

if (!confirmed) {
  console.log(
    [
      '',
      'Dry run (no --yes): nothing was changed and no connection was made.',
      'With --yes, in one transaction, this script will:',
      `  1. delete all data of these seed users (exact email match): ${emails.join(', ')}`,
      '     - their applications, and any application on their pets (including from other users)',
      '     - notifications that point at those applications',
      '     - their pets, then the users themselves (their notifications and saved pets cascade)',
      `  2. insert ${data.users.length} users, ${data.pets.length} pets, ` +
        `${data.applications.length} applications, 1 AI summary, ${data.notifications.length} notifications`,
      '',
      'Run again with --yes to apply:  npm run seed -- --yes',
    ].join('\n'),
  );
  process.exit(0);
}

// ---------- 5-9. Reset and insert ----------
const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD, SALT_ROUNDS);
const now = Date.now();
const daysAgo = (days) => new Date(now - days * DAY_MS);

const client = new pg.Client({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  // Added only when DB_SSL=true; the server certificate is verified.
  ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
});

try {
  await client.connect();
  await client.query('BEGIN');

  // --- Reset: only rows tied to the seed emails ---
  const existing = await client.query('SELECT id FROM users WHERE email = ANY($1::text[])', [emails]);
  const seedIds = existing.rows.map((r) => r.id);

  const delApps = await client.query(
    `DELETE FROM adoption_applications
     WHERE applicant_id = ANY($1::uuid[])
        OR pet_id IN (SELECT id FROM pets WHERE owner_id = ANY($1::uuid[]))
     RETURNING id, applicant_id`,
    [seedIds],
  );
  const deletedAppIds = delApps.rows.map((r) => r.id);
  const foreignApps = delApps.rows.filter((r) => !seedIds.includes(r.applicant_id)).length;

  // entity_id has no FK, so notifications pointing at deleted applications
  // (including ones sent to non-seed users) are removed here explicitly.
  const delNotifs = await client.query(
    'DELETE FROM notifications WHERE entity_id = ANY($1::uuid[]) AND NOT (user_id = ANY($2::uuid[]))',
    [deletedAppIds, seedIds],
  );
  const delPets = await client.query('DELETE FROM pets WHERE owner_id = ANY($1::uuid[])', [seedIds]);
  const delUsers = await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [seedIds]);

  // --- Insert ---
  const userIds = new Map();
  for (const u of data.users) {
    const { rows } = await client.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
      [u.email, passwordHash, u.displayName],
    );
    userIds.set(u.key, rows[0].id);
  }

  // An adopted pet was last updated when its application was approved.
  const approvedDaysByPet = new Map(
    data.applications.filter((a) => a.status === 'approved').map((a) => [a.petKey, a.decidedDaysAgo]),
  );
  const petIds = new Map();
  for (const [i, p] of data.pets.entries()) {
    const createdAt = daysAgo(p.daysAgo);
    const updatedAt = approvedDaysByPet.has(p.key) ? daysAgo(approvedDaysByPet.get(p.key)) : createdAt;
    const { rows } = await client.query(
      `INSERT INTO pets (owner_id, name, species, age_months, province, description, requirements,
                         image_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userIds.get(p.ownerKey), p.name, p.species, p.ageMonths, p.province, p.description,
        p.requirements, images[i], p.status, createdAt, updatedAt],
    );
    petIds.set(p.key, rows[0].id);
  }

  const apps = new Map();
  for (const a of data.applications) {
    const createdAt = daysAgo(a.daysAgo);
    // Approve/reject set decided_at; withdraw does not (same as the API).
    const decidedAt = a.decidedDaysAgo === undefined ? null : daysAgo(a.decidedDaysAgo);
    const { rows } = await client.query(
      `INSERT INTO adoption_applications (pet_id, applicant_id, answers, status, created_at, decided_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6) RETURNING id`,
      [petIds.get(a.petKey), userIds.get(a.applicantKey), JSON.stringify(a.answers), a.status, createdAt, decidedAt],
    );
    apps.set(a.key, { id: rows[0].id, createdAt, decidedAt });
  }

  await client.query(
    `INSERT INTO ai_summaries (application_id, status, attempts, summary)
     VALUES ($1, 'done', 1, $2::jsonb)`,
    [apps.get(data.aiSummary.applicationKey).id, JSON.stringify(data.aiSummary.summary)],
  );

  for (const n of data.notifications) {
    const app = apps.get(n.applicationKey);
    // A notification is created at the moment of the event that caused it.
    const createdAt = n.type === 'application.received' ? app.createdAt : app.decidedAt;
    const readAt = n.read ? new Date(createdAt.getTime() + HOUR_MS) : null;
    await client.query(
      `INSERT INTO notifications (user_id, type, entity_id, message, read_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userIds.get(n.userKey), n.type, app.id, NOTIFICATION_MESSAGES[n.type], readAt, createdAt],
    );
  }

  await client.query('COMMIT');

  console.log(
    [
      'Removed old seed data:',
      `  users ${delUsers.rowCount}, pets ${delPets.rowCount}, applications ${delApps.rowCount}` +
        ` (${foreignApps} from non-seed users), notifications of non-seed users ${delNotifs.rowCount}`,
      'Inserted:',
      `  users ${data.users.length}, pets ${data.pets.length}, applications ${data.applications.length},` +
        ` ai_summaries 1, notifications ${data.notifications.length}`,
      `Demo accounts: ${data.users.filter((u) => ['owner', 'adopter'].includes(u.key)).map((u) => u.email).join(', ')}`,
    ].join('\n'),
  );
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(`seed: failed, rolled back. ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
