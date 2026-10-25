# Plan: project-setup

spec: `_specs/project-setup.md` · branch: `claude/feature/project-setup-01` · roadmap ข้อ 1 (🤖 AI เขียนได้)

## Context
`api/` ตอนนี้เป็นแค่ scaffold จาก `nest g` (Hello World: `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`, `test/app.e2e-spec.ts`) ไม่มี database, config หรือ health check
ฟีเจอร์ถัดไป (migration, pets, applications) ต้องการ Postgres ที่รันในเครื่อง, config จาก `.env` และ pool กลางที่ inject ได้ งานนี้วางรากฐานทั้งหมดนั้น

**ขอบเขต:** ไม่แตะ `api/src/auth/`, `api/src/applications/`, `api/src/worker/` (ส่วนต้องห้าม) — ไม่มีขั้นไหนในแผนนี้ต้องหยุดถามก่อน

## สิ่งที่มีอยู่แล้ว (ไม่ต้องทำซ้ำ)
- `.gitignore` ราก ignore `.env`, `.env.*` และมี `!.env.example` อยู่แล้ว → แค่ตรวจด้วย `git check-ignore`
- Jest config อยู่ที่ `api/jest.config.ts` (testRegex `.spec.ts`, ts-jest) ใช้ได้เลย
- Dependencies ปัจจุบัน: NestJS 12, ยังไม่มี `pg` และ `@nestjs/config`

## การตัดสินใจหลัก
| เรื่อง | เลือก | เหตุผล |
|---|---|---|
| Config | `@nestjs/config` + ฟังก์ชัน `validate` เขียนเอง (ไม่เพิ่ม joi/zod) | fail-fast ตอน bootstrap ด้วยข้อความชัด, deps น้อย |
| ตัวแปร DB | แยกเป็น `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` ไม่ใช้ connection URL | รหัสผ่านมีอักขระพิเศษได้โดยไม่ต้อง URL-encode (edge case ใน spec); compose อ่านค่าเดียวกันจาก `api/.env` |
| Pool | provider เดียว ผ่าน token `PG_POOL`, `DatabaseModule` เป็น `@Global()` | pool เดียวทั้งแอป, class อื่น `@Inject(PG_POOL)` ผ่าน constructor |
| Health | module `src/health/` (controller + service) | แยก logic เช็ก DB ออกจาก controller ให้เทสต์ง่าย ตามแพตเทิร์น controller → service |
| เชื่อมต่อ DB | lazy (ไม่ connect ตอนบูต) | Postgres ยังไม่พร้อมตอน API บูตก็ยังสตาร์ตได้ และ `/health` รายงาน 503 แทน |
| Neon (deploy) | ยังไม่ทำ — ตอนข้อ 13 ค่อยเพิ่ม `DATABASE_URL`/ssl | นอกขอบเขต setup |

## ขั้นตอน
1. **Dependencies** (`api/`): `npm i pg @nestjs/config` และ `npm i -D @types/pg` — เช็ก API ของ pg/@nestjs/config เวอร์ชันที่ลงจริงใน `node_modules` ก่อนเขียน (Context7 ไม่พร้อมใช้ใน session นี้)
2. **Env + compose**
   - `api/.env.example`: `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ค่าตัวอย่างปลอดภัย พร้อมคอมเมนต์สั้น ๆ
     - `DB_PASSWORD` ต้องอยู่ในเครื่องหมายคำพูดเดี่ยวเสมอ เช่น `DB_PASSWORD='change-me-locally'` พร้อมคอมเมนต์เหนือบรรทัดนั้นอธิบายเหตุผล:
       ```
       # ใส่ DB_PASSWORD ในเครื่องหมายคำพูดเดี่ยว ('...') เสมอ
       # เพื่อกันปัญหาทั้ง # (ถูกตีความเป็นคอมเมนต์ ทำให้รหัสผ่านถูกตัดกลางคัน)
       # และ $ (docker compose ตีความเป็นตัวแปร ทำให้ค่าเพี้ยนหรือหาย)
       DB_PASSWORD='change-me-locally'
       ```
     - ข้อจำกัด: รหัสผ่านต้องไม่มีเครื่องหมายคำพูดเดี่ยว (`'`) อยู่ข้างใน
   - `api/docker-compose.yml`: service `postgres` เท่านั้น, image `postgres:17-alpine`, `POSTGRES_DB/USER/PASSWORD` ← `${DB_*}` (ใช้ `${DB_PASSWORD:?...}` เพื่อ error ชัดถ้าไม่ได้ตั้ง), ports `${DB_PORT}:5432`, named volume `pgdata`, healthcheck `pg_isready -U ${DB_USER} -d ${DB_NAME}`
   - ผู้ใช้สร้าง `api/.env` เองจาก example (ไฟล์นี้ไม่ถูก commit)
3. **Config loader** `src/config/env.ts` + `env.spec.ts`
   - `validateEnv(raw)` ฟังก์ชันบริสุทธิ์: ตรวจตัวแปรที่จำเป็นไม่ว่าง, port เป็นจำนวนเต็ม 1–65535; ขาด/ผิด → throw `Error` รวมรายชื่อตัวแปรที่มีปัญหาทั้งหมดในครั้งเดียว (ไม่พิมพ์ค่า password)
   - คืนค่า object ที่แปลง type แล้ว (`port: number` ฯลฯ)
4. **DatabaseModule** `src/database/`
   - `database.constants.ts` → `export const PG_POOL = Symbol('PG_POOL')`
   - `database.module.ts` → `@Global()`; provider `PG_POOL` ใช้ factory + `ConfigService` สร้าง `new Pool({ host, port, database, user, password, connectionTimeoutMillis })`; ผูก `pool.on('error', ...)` เพื่อ log แทนที่จะให้ idle-client error ทำ process crash; class module implements `OnApplicationShutdown` เรียก `pool.end()`
5. **Health** `src/health/`
   - `health.service.ts`: `check()` รัน `SELECT 1` ผ่าน pool แข่งกับ timeout สั้น (~2s, ล้าง timer เสมอ); คืน `true/false` ไม่โยน error ออกไป และไม่ส่งข้อความ error ของ pg ออกไปข้างนอก (log ภายในเท่านั้น)
   - `health.controller.ts`: `GET /health` → 200 `{ status: 'ok', database: 'up' }`; ถ้า DB ล้ม → throw `ServiceUnavailableException({ status: 'error', database: 'down' })` (503)
   - ตรวจใน `node_modules/pg` ว่ามี per-query timeout ไหม ถ้ามีใช้ร่วมด้วย ถ้าไม่มีใช้ `Promise.race` อย่างเดียว
6. **Wire up**
   - `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate: validateEnv })`, import `DatabaseModule`, `HealthModule`; ลบ `AppController`/`AppService`
   - `main.ts`: `app.enableShutdownHooks()` (จำเป็นให้ `OnApplicationShutdown` ทำงาน) และอ่าน port จาก `ConfigService`
7. **เก็บกวาดเทสต์ scaffold**: ลบ `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`; แปลง `test/app.e2e-spec.ts` เป็น e2e ของ `/health` โดย `overrideProvider(PG_POOL)` ด้วย fake pool (รันได้โดยไม่ต้องมี Postgres)
8. **เอกสาร**: เติมวิธีรันสั้น ๆ ใน `api/README.md` (copy `.env.example` → `.env`, `docker compose up -d`, `npm run start:dev`); ติ๊กข้อ 1 ใน `docs/roadmap.md` หลังผ่านทุกเกณฑ์

## เทสต์ (colocated `xxx.spec.ts`, ตรงกับ Testing Guidelines ใน spec)
- `src/config/env.spec.ts`: ครบ → คืนค่าที่คาดไว้ / ขาดตัวแปร → error ชัด (และไม่มีค่า password ในข้อความ)
- `src/health/health.controller.spec.ts` (+ service ถ้าจำเป็น): query สำเร็จ → 200 + `database: up`; query ล้มเหลว → 503; query ค้างเกิน timeout → 503 (ใช้ fake timers); body ของ 503 ไม่มี credentials
- `test/app.e2e-spec.ts`: `GET /health` 200 และ 503 ผ่าน HTTP จริงด้วย fake pool

## ไฟล์ที่เกี่ยวข้อง
สร้างใหม่: `api/.env.example`, `api/docker-compose.yml`, `api/src/config/env.ts(+spec)`, `api/src/database/database.{constants,module}.ts`, `api/src/health/health.{module,controller,service}.ts(+spec)`
แก้: `api/package.json`(+lock), `api/src/app.module.ts`, `api/src/main.ts`, `api/test/app.e2e-spec.ts`, `api/README.md`, `docs/roadmap.md`
ลบ: `api/src/app.controller.ts`, `api/src/app.service.ts`, `api/src/app.controller.spec.ts`

## Verification (ตรงกับ Acceptance Criteria)
1. `cd api && docker compose up -d` → `docker compose ps` แสดง healthy; `docker compose down && up -d` แล้วข้อมูลใน volume ยังอยู่
2. `npm run start:dev` กับ `.env` ถูกต้อง → สตาร์ตได้; `curl localhost:3000/health` → 200 `{"status":"ok","database":"up"}`
3. `docker compose stop` → `curl -i /health` → 503 + `database: down` และ body ไม่มี host/user/password
4. ลบตัวแปรหนึ่งตัว (หรือทำให้ว่าง) ใน `.env` → API ไม่ยอมสตาร์ต พร้อมข้อความระบุชื่อตัวแปร
5. ตั้ง `DB_PASSWORD='p@ss:w/rd#1$x'` (ในเครื่องหมายคำพูดเดี่ยว) ใน `.env` → compose และ API ยังเชื่อมต่อได้ (ครอบคลุมทั้ง `#` และ `$`)
6. `git check-ignore api/.env` พิมพ์ path; `git ls-files api/.env.example` พบไฟล์
7. Ctrl+C ตอน API รันอยู่ → ปิดสะอาด ไม่มี open handle (pool.end ถูกเรียก)
8. `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build` ผ่านทั้งหมด

## ความเสี่ยง / ข้อสังเกต
- `.env` เป็นของผู้ใช้ — compose ต้องการค่าจากไฟล์นี้ ต้องสร้างก่อนรัน `docker compose up`
- รหัสผ่านที่มี `#` หรือ `$` ใน `.env` อาจถูกตีความผิด (`#` = คอมเมนต์, `$` = ตัวแปรของ compose) — แก้โดยบังคับให้ `DB_PASSWORD` อยู่ใน single quote เสมอ และอธิบายเหตุผลเป็นคอมเมนต์ใน `.env.example`
- ตามกติกา CLAUDE.md: ตอน implement จะอธิบายสั้น ๆ ว่าแต่ละส่วนทำอะไร
