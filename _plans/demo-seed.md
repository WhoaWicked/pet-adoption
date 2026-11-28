# Plan: demo-seed

branch: `claude/feature/demo-seed` · ไม่แตะ `web/` · ไม่แตะ logic ใน `api/src/auth|applications|pets` (อ่านอย่างเดียวเพื่อดู shape/ค่าคงที่)

## Context
หลัง deploy ฐานข้อมูลว่างเปล่า ต้องการคำสั่งเดียว (`npm run seed -- --yes`) ที่สร้างข้อมูลปลอมสำหรับเดโม
ให้หน้าเว็บมีสัตว์ให้ดู และบัญชีทดลอง (demo-owner / demo-adopter) มีข้อมูลในทุกหน้า
script รันเดี่ยว ๆ ไม่ bootstrap Nest ไม่เรียก repository ไม่เรียก AI

## ข้อเท็จจริงที่ตรวจแล้ว
| เรื่อง | ค่าจริง | ที่มา |
|---|---|---|
| hash รหัสผ่าน | `bcryptjs` cost `10` | `api/src/auth/password.ts` (`SALT_ROUNDS = 10`) |
| species | `'dog' \| 'cat' \| 'other'` | migration (CHECK) |
| สถานะสัตว์ | `available \| adopted \| closed` | migration |
| สถานะคำขอ | `pending \| approved \| rejected \| withdrawn`, `UNIQUE (pet_id, applicant_id)` | migration |
| answers | `{ housingType: 'house'\|'condo'\|'apartment'\|'other', hasPetExperience: boolean, note?: string }` | `ApplicationAnswers` |
| decided_at | approve/reject ตั้ง `NOW()` · withdraw **ไม่ตั้ง** (เป็น NULL) | applications.repository.ts |
| แจ้งเตือน | `entity_id` = id ของคำขอ · message ภาษาอังกฤษ (`'You received a new adoption application'`, `'Your adoption application was approved'`, `'Your adoption application was not selected'`) · web แปลงเป็นไทยจาก `type` | applications.repository.ts, `web/.../notification-content.ts` |
| ai_summaries | PK = `application_id` (CASCADE จากคำขอ) · summary `{overview, highlights[], concerns[]}` · overview ≤ 600, list ≤ 5 ข้อ, ข้อละ ≤ 200 | migration, `ai.constants.ts` |
| FK ตอนลบ | applications→pets/users = **RESTRICT** · ai_summaries = CASCADE (จากคำขอ) · saved_pets = CASCADE (จาก users และ pets) · notifications = CASCADE (จาก users), `entity_id` **ไม่มี FK** | migration |
| ภาษา UI | ไทย · จังหวัดต้องสะกดตรงกับ `web/src/lib/constants/provinces.ts` (filter เทียบตรงตัว) | web/ |
| โหลด env | `process.loadEnvFile(api/.env)` ข้ามเมื่อไม่มีไฟล์ ไม่ override ค่าที่ตั้งไว้แล้ว · ตรวจ `DB_*` แจ้งแค่ชื่อตัวแปร | `scripts/migrate.mjs` |
| รูป | `scripts/seed-images.txt` มี 20 บรรทัด | นับแล้ว |

## ไฟล์
1. **`api/scripts/seed-data.json`** ข้อมูลปลอมทั้งหมด อ้างอิงกันด้วย `key` (ไม่ใช่ uuid)
   - `users[5]`: `{ key, email, displayName }` — `demo-owner@example.com` "Demo Owner", `demo-adopter@example.com` "Demo Adopter", ผู้สมัครเสริม 3 คน (`applicant-1..3@example.com`) · รายการอีเมลนี้คือ **ตัวระบุแถวของ seed ตอนลบ**
   - `pets[20]`: `{ key, ownerKey, name, species, ageMonths, province, description, requirements, status }` ภาษาไทย · demo-owner 15 ตัว, ผู้สมัครเสริม 5 ตัว · หมาและแมวเป็นส่วนใหญ่ + `other` 2–3 ตัว · `adopted` 2 ตัว ที่เหลือ `available` · ตัวที่ i ได้รูปบรรทัดที่ i
   - `applications[]`: `{ key, petKey, applicantKey, status, answers, daysAgo }`
     - pending 5–6 ใบบนสัตว์ของ demo-owner 3 ตัว จากผู้สมัครคนละคน
     - demo-adopter 4 ใบ: pending, approved (สัตว์ตัวที่ adopted ตัวหนึ่ง ของผู้สมัครเสริม), rejected (คู่กับใบที่ approved บนสัตว์ adopted อีกตัวของ demo-owner), withdrawn
     - สัตว์ adopted แต่ละตัว: approved 1 ใบ + rejected ที่เหลือ
   - `notifications[]`: `{ userKey, type, applicationKey, read }` ของ demo-owner (received) และ demo-adopter (approved/rejected) ผสมอ่าน/ยังไม่อ่าน
   - `aiSummary`: `{ applicationKey, summary }` 1 อัน ผูกกับใบ pending บนสัตว์ demo-owner · เนื้อหาสรุปอย่างเดียว ไม่ให้คะแนน/ไม่แนะนำ
2. **`api/scripts/seed.mjs`** (ESM โครงเดียวกับ migrate.mjs)
3. **`api/package.json`**: `"seed": "node scripts/seed.mjs"` (รันจริง `npm run seed -- --yes`)

## ลำดับการทำงานของ seed.mjs
1. parse args: รู้จักแค่ `--yes` · flag อื่น → error exit 1 (กันพิมพ์ผิดแล้วเข้าใจว่ารันแล้ว)
2. โหลด env แบบ migrate.mjs → ตรวจ `DB_*` (ชื่อเท่านั้น) และ `DEMO_PASSWORD` (ไม่มี → error ชัดเจน exit 1, ไม่ print ค่า)
3. อ่าน `seed-data.json` + `seed-images.txt` (ข้ามบรรทัดว่าง) แล้ว **validate ก่อนแตะ DB**: จำนวนรูป = จำนวนสัตว์, ค่า enum ถูก, key อ้างอิงมีจริง, ไม่สมัครสัตว์ตัวเอง, ไม่ซ้ำ (pet, applicant), pending/withdrawn อยู่บนสัตว์ available เท่านั้น, สัตว์ adopted มี approved 1 ใบพอดีและที่เหลือ rejected, approved มีบนสัตว์ adopted เท่านั้น, type แจ้งเตือนตรงกับสถานะคำขอและผู้รับถูกคน, summary ผูกกับใบ pending และอยู่ในขนาดที่กำหนด → ผิดข้อไหนบอกข้อนั้น exit 1
4. **Guard**: print `Target database: <DB_NAME> on <DB_HOST>:<DB_PORT>` (ไม่ print user/password/URL)
   - ไม่มี `--yes` → print สิ่งที่จะทำ (ลบข้อมูลของอีเมล seed 5 รายการ + จะสร้างกี่แถวต่อตาราง) แล้ว `exit 0` **ไม่เชื่อมต่อ DB**
5. hash `DEMO_PASSWORD` ครั้งเดียว (bcryptjs, cost 10) ใช้กับทั้ง 5 บัญชี
6. ต่อ DB ด้วย `pg.Client` จาก `DB_*` → `BEGIN`
7. **Reset** (เฉพาะแถวที่ผูกกับอีเมล seed ตรงตัว):
   1. `SELECT id FROM users WHERE email = ANY($emails)` → `seedUserIds`
   2. `DELETE FROM adoption_applications WHERE applicant_id = ANY($ids) OR pet_id IN (SELECT id FROM pets WHERE owner_id = ANY($ids)) RETURNING id` → ai_summaries ของใบเหล่านี้หายตาม CASCADE
   3. `DELETE FROM notifications WHERE entity_id = ANY($deletedAppIds)` (ดูคำถามข้อ 1)
   4. `DELETE FROM pets WHERE owner_id = ANY($ids)` → saved_pets ของสัตว์เหล่านี้หายตาม CASCADE
   5. `DELETE FROM users WHERE id = ANY($ids)` → notifications/saved_pets ของ seed users หายตาม CASCADE
   - ไม่มี TRUNCATE, ไม่มี LIKE, ไม่มี DELETE ที่ไม่มี WHERE
8. **Insert** ตามลำดับ users → pets (image_url จากรูป) → applications (ระบุ status เอง, `created_at = now() - daysAgo`, `decided_at` = ตั้งค่าเฉพาะ approved/rejected) → ai_summaries (`status 'done'`, `attempts 1`) → notifications (message ภาษาอังกฤษชุดเดียวกับ repository, `read_at` = ค่าเมื่ออ่านแล้ว / NULL)
9. `COMMIT` แล้ว print จำนวนแถวที่ลบ/สร้าง · error ใด ๆ → `ROLLBACK`, print ข้อความ error, exit 1 · ปิด client ใน `finally`

## การทดสอบที่ผมรันเอง
- `node --check scripts/seed.mjs` เท่านั้น
- **ไม่รัน dry run** เพราะ script โหลด `api/.env` เสมอและ print host/ชื่อ DB จากไฟล์นั้น ซึ่งขัดกฎห้ามอ่าน/print ค่าใน `.env` → Guy รัน `npm run seed` (ไม่มี `--yes`) เองก่อน

## ข้อสังเกต / ต่างจาก brief
- **`--env-file`**: `migrate:up` จริง ๆ ไม่ได้ใช้ `--env-file` (ใช้ `loadEnvFile` ในตัว script) ผมจะทำตาม migrate.mjs (ไม่ใช้ flag) เพราะถ้าใส่ `--env-file=.env` แล้วไม่มีไฟล์ (เช่นรันกับ Neon โดยตั้ง env เอง) Node จะ error
- **รูปกับชนิดสัตว์**: ผมเห็นแค่ URL ไม่เห็นรูป จึงจับคู่ตามลำดับบรรทัด Guy ต้องตรวจว่ารูปบรรทัดที่ i ตรงกับ species/ชื่อของสัตว์ตัวที่ i ใน JSON
- **id ของบัญชีเดโมเปลี่ยนทุกครั้งที่ seed** (ลบแล้วสร้างใหม่ตาม brief) → token ของคนที่ login เดโมค้างไว้จะใช้ไม่ได้ ต้อง login ใหม่
- ค่าคงที่ `SALT_ROUNDS = 10` ซ้ำกับ `password.ts` เพราะ .mjs import ไฟล์ TS ไม่ได้ (เขียนคอมเมนต์บอกไว้)

## การตัดสินใจ
- ผู้ใช้จริงที่สมัครสัตว์ของเดโม: **ลบคำขอเหล่านั้นพร้อมแจ้งเตือนที่ชี้ไปยังคำขอนั้น และ print จำนวน** (Guy เลือก)
- ตรวจ dry run บนสำเนาใน scratchpad (ไม่มี `.env`, env ปลอม) แทนการรันใน `api/` — ไม่อ่าน `.env` จริงและไม่ต่อ DB
