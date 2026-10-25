# Plan: database-migrations

spec: `_specs/database-migrations.md` · branch: `claude/feature/database-migrations` · roadmap ข้อ 2 (🤖 AI เขียนได้, ผู้พัฒนารีวิว constraint เอง)

## Context
ตอนนี้ database ว่างเปล่า มีแค่ `docs/schema.sql` (6 ตาราง) ที่เป็นการออกแบบตั้งต้น ฟีเจอร์ถัดไป (auth, pets, applications, notifications) ต้องมีตารางจริงและต้องเปลี่ยน schema ได้แบบมีเวอร์ชัน/ย้อนกลับได้
งานนี้ติดตั้ง `node-pg-migrate` (ไฟล์ `.sql`), สร้าง migration แรกที่ขา up เหมือน `docs/schema.sql` ทุกบรรทัด, ขา down, และ npm script migrate up/down ที่ใช้ `api/.env` ชุดเดียวกับ API

**ขอบเขต:** ไม่แตะ `api/src/auth/`, `api/src/applications/`, `api/src/worker/` — ไม่มีขั้นไหนต้องหยุดถาม ไม่มี automated test (ตาม spec) ตรวจด้วยมือตาม Acceptance Criteria

## ข้อเท็จจริงที่ตรวจแล้ว
- `node-pg-migrate` latest = **9.0.0**: `"type": "module"`, engines `node >=20.11`, peer `pg >=4.3 <9` (โปรเจกต์ใช้ pg 8.23) → เข้ากันได้ และเรียกเป็น CLI ผ่าน child process เท่านั้น จึงไม่ชนกับ CJS ของ Nest build หรือ Jest (`--experimental-vm-modules`) เพราะไม่ถูก import ในโค้ดแอป/เทสต์
- CLI: อ่านการเชื่อมต่อจาก `DATABASE_URL` (หรือ config file แบบ discrete fields) — **ไม่อ่าน `DB_*`** ของเรา; ตารางติดตามชื่อ `pgmigrations`; `up` ค่าเริ่มต้น = ทุกไฟล์ที่ค้าง, `down` ค่าเริ่มต้น = ย้อน 1 ไฟล์; `create -j sql` สร้างไฟล์ `.sql` นำหน้าด้วย timestamp
- เอกสารที่อ่านได้เป็นของ v10-alpha รายละเอียดบางอย่างของ v9 (รูปแบบ marker ในไฟล์ SQL, ค่าเริ่มต้นเรื่อง transaction) **ต้องยืนยันใน `node_modules` หลังติดตั้ง** (Context7 ไม่พร้อมใช้)
- ไฟล์ SQL ใช้ marker `-- Up Migration` / `-- Down Migration` (จะยืนยันกับ template ที่ `create -j sql` สร้างให้จริง)

## การตัดสินใจหลัก
| เรื่อง | เลือก | เหตุผล |
|---|---|---|
| ต่อ DB ด้วย `DB_*` | สคริปต์ห่อ `api/scripts/migrate.mjs` อ่าน `api/.env` → ประกอบ `DATABASE_URL` โดย `encodeURIComponent` ที่ user/password → รัน CLI ของ node-pg-migrate เป็น child process | ใช้ตัวแปรชุดเดียวกับ API ตาม spec; รหัสผ่านที่มี `# $ @ : /` ถูก encode ถูกต้อง; ไม่ต้องมี config file ที่ซ้ำรหัสผ่าน |
| อ่าน `.env` | `process.loadEnvFile('.env')` ของ Node (รองรับ single quote, ไม่ expand `$`, `#` ในเครื่องหมายคำพูดไม่เป็นคอมเมนต์) ไม่ override ค่าที่ตั้งไว้แล้วใน environment | ไม่เพิ่ม dependency; ใช้ได้ทั้งในเครื่องและใน CI (ถ้า `.env` ไม่มีแต่ตั้งตัวแปรไว้แล้วก็ใช้ได้) |
| รัน CLI | `process.execPath` + path ของ `node-pg-migrate/bin/node-pg-migrate` (resolve ผ่าน `import.meta.resolve`) | ข้ามปัญหา `.cmd` shim บน Windows, ไม่ต้องใช้ shell |
| ตำแหน่ง/ชื่อ | `api/migrations/`, ชื่อแบบ timestamp ตามค่าเริ่มต้น (สร้างด้วย `create -j sql`) | ตาม spec |
| dependency | `npm i -D node-pg-migrate` | ใช้ตอน dev/CI; ถ้าตอน deploy (ข้อ 13) ต้องรันบน Render ให้ย้ายไป dependencies ตอนนั้น |
| ขา up | คัดลอกเนื้อหา `docs/schema.sql` ทั้งไฟล์แบบตัวต่อตัว ไม่มี `IF NOT EXISTS`/แก้ไขใด ๆ | spec: "เหมือนทุกบรรทัด"; ตารางชนกัน = fail ใน transaction (ตามต้องการ) |
| ขา down | `DROP TABLE` ไม่ใส่ `IF EXISTS` เรียง: `notifications, saved_pets, ai_summaries, adoption_applications, pets, users` | เรียงตาม FK; index หายไปพร้อมตาราง; ถ้า schema เพี้ยนให้ล้มดัง ๆ |

## ขั้นตอน
1. **ติดตั้ง:** `cd api && npm i -D node-pg-migrate` แล้วตรวจใน `node_modules/node-pg-migrate` ว่า (ก) marker ของไฟล์ SQL, (ข) ค่าเริ่มต้นเรื่อง transaction ต่อไฟล์ (`--single-transaction`), (ค) ตัวเลือก `-m`, `-j`, `--check-order` ตรงกับที่วางแผน
2. **สคริปต์ห่อ** `api/scripts/migrate.mjs` (ESM, ไม่ถูก lint/build ของ Nest): โหลด `.env` (ข้ามเมื่อไม่มีไฟล์) → ตรวจ `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` ครบและไม่ว่าง ไม่งั้นพิมพ์ข้อความชัดเจน (ชื่อตัวแปรเท่านั้น ไม่พิมพ์ password) และ `exit 1` → ตั้ง `DATABASE_URL` → spawn CLI ด้วย `<command> ...args -m migrations` (เพิ่ม `-j sql` เมื่อ command เป็น `create`) → ส่งต่อ exit code
   - การตรวจตัวแปรซ้ำกับ `src/config/env.ts` เล็กน้อย ยอมรับเพราะสคริปต์เป็น ESM ที่ import TS ไม่ได้ (บันทึกเป็นคอมเมนต์ในไฟล์)
3. **npm scripts** (`api/package.json`): `migrate:up` → `node scripts/migrate.mjs up`, `migrate:down` → `... down`, `migrate:create` → `... create` (ใช้สร้าง migration ต่อ ๆ ไปให้ได้ชื่อ timestamp และเป็น `.sql`)
4. **migration แรก:** `npm run migrate:create -- initial-schema` สร้างไฟล์ `api/migrations/<timestamp>_initial-schema.sql` แล้วเติม
   - ส่วน `-- Up Migration`: เนื้อหา `docs/schema.sql` ทั้งหมด (6 ตาราง, ทุก constraint และ index ที่ประกาศเอง 5 ตัว: `idx_pets_browse`, `idx_pets_owner`, `idx_applications_applicant`, `idx_saved_pets_user`, `idx_notifications_user` — PK/UNIQUE index ที่ Postgres สร้างให้เองมาจาก constraint อยู่แล้ว)
   - ส่วน `-- Down Migration`: `DROP TABLE` 6 ตามลำดับข้างบน
5. **หมายเหตุบน `docs/schema.sql`:** เติมคอมเมนต์ SQL หัวไฟล์ (ภาษาไทย) ว่านี่คือการออกแบบตั้งต้น schema ปัจจุบันให้ดูจาก `api/migrations/` คั่นด้วยบรรทัดว่างก่อน `CREATE TABLE users` — การเทียบ diff ใช้เนื้อหาตั้งแต่ `CREATE TABLE users` เป็นต้นไป เพื่อให้ผลเทียบยังหมายถึง "ขา up เหมือนต้นฉบับ"
6. **เอกสาร:** `api/README.md` เพิ่มหัวข้อวิธีรัน `npm run migrate:up` / `migrate:down` / `migrate:create -- <ชื่อ>`, วิธีล้าง DB dev (`docker compose down -v`) เมื่อมีตารางชนกัน, และข้อควรระวังว่า `down` ลบข้อมูล; `docs/roadmap.md` ติ๊กข้อ 2 **หลังผู้พัฒนายืนยันว่ารีวิว constraint แล้ว** (ไม่ติ๊กเอง)

## ไฟล์ที่เกี่ยวข้อง
สร้างใหม่: `api/scripts/migrate.mjs`, `api/migrations/<timestamp>_initial-schema.sql`
แก้: `api/package.json`(+lock), `docs/schema.sql` (หัวไฟล์), `api/README.md`, `docs/roadmap.md` (หลังยืนยัน)
ใช้ซ้ำ: ชื่อตัวแปร/ข้อความเตือนจาก `api/.env.example` และตรรกะตรวจ env ใน `api/src/config/env.ts` (ไม่ import — แค่สะท้อนกฎเดียวกัน)

## Verification (ตรงกับ Acceptance Criteria — ทำกับ DB dev ผ่าน Docker)
เตรียม: เปิด Docker Desktop, `docker compose down -v && docker compose up -d --wait` (ล้าง volume เพื่อให้รหัสผ่านใน `.env` ตรงกับตอน init; `.env` เครื่องนี้ใช้ `DB_PORT=5433` เพราะ 5432 ถูก Postgres ของ Windows ใช้)
1. `npm run migrate:up` → ผ่าน; `docker compose exec postgres psql -U … -d … -c '\dt'` เห็น 6 ตาราง + `pgmigrations`; `\d <table>` ตรวจคอลัมน์/default/constraint/index
2. **diff ขา up กับต้นฉบับ:** ตัดส่วนระหว่าง marker ของไฟล์ migration เทียบกับ `docs/schema.sql` ตั้งแต่ `CREATE TABLE users` → ต้องไม่มี diff
3. `npm run migrate:up` ซ้ำ → "No migrations to run" ไม่ error
4. constraint ด้วยมือผ่าน psql (สคริปต์ชั่วคราวใน scratchpad ไม่ commit): `species`/`status` ผิด, `age_months < 0`, email ซ้ำ, `(pet_id, applicant_id)` ซ้ำ → ถูกปฏิเสธ; ลบ user/pet ที่ถูกอ้างอิง → ถูกปฏิเสธ (RESTRICT); ลบ application → `ai_summaries` หาย; ลบ user → `saved_pets`+`notifications` ของเขาหาย; ลบ pet → `saved_pets` หาย แต่ `notifications` ไม่หาย
5. `npm run migrate:down` → เหลือเฉพาะ `pgmigrations`; `migrate:down` อีกครั้ง (ไม่มีอะไรให้ย้อน) → ไม่ error; แล้ว `migrate:up` อีก → ผ่าน (up → down → up)
6. ทดสอบความล้มเหลว (ตรวจว่า output **ไม่มีรหัสผ่าน**): หยุด Postgres, รหัสผ่านผิด, ไม่มี database, ลบ `api/.env`/ทำตัวแปรว่าง → ได้ error ที่เข้าใจได้ exit code ไม่ใช่ 0
7. รหัสผ่านพิเศษ: ยืนยันว่า `DB_PASSWORD='p@ss:w/rd#1$x'` ใน `.env` ใช้ได้ทั้ง compose, API และ migrate
8. ไม่กระทบของเดิม: `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e` ยังผ่าน

## ความเสี่ยง / ข้อสังเกต
- ข้อสันนิษฐานเรื่อง v9 (marker, ค่าเริ่มต้น transaction, ชื่อ option) มาจากเอกสาร v10-alpha → ขั้น 1 ต้องยืนยันก่อนเขียนโค้ด ถ้าต่างจากแผนจะแก้แผนก่อนทำต่อ
- รหัสผ่านใน `DATABASE_URL` อยู่ใน environment ของ child process เท่านั้น ไม่ถูกพิมพ์; ต้องยืนยันตามข้อ 6 ว่า CLI ไม่ echo URL ตอน error
- `down` ลบข้อมูล dev ทั้งหมด (ตาม spec จึงไม่มี automated test) — README ต้องเตือน
- การรัน migrate ตอน deploy/CI และการย้าย `node-pg-migrate` ไป dependencies ตัดสินที่ข้อ 13
- ตามกติกา CLAUDE.md: ตอน implement จะอธิบายสั้น ๆ ว่าแต่ละส่วนทำอะไร
