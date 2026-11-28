# Plan: แก้ API บน Vercel ล้มด้วย ERR_REQUIRE_ESM

ขอบเขต: แก้ให้ function บูตได้ **ไม่ deploy ไม่ commit** ไม่แตะส่วนต้องห้าม

## สาเหตุ
1. `@nestjs/*` v12 เป็น ESM ล้วน (`"type": "module"` ไม่มี build แบบ CJS)
2. `api/` ไม่มี `"type": "module"` และใช้ `module: nodenext` จึง compile ออกมาเป็น CommonJS (`require(...)`)
3. คู่นี้ทำงานได้ต้องพึ่ง `require(esm)` ซึ่ง Node เปิดเป็นค่าเริ่มต้น (20.19+, 22.12+) จึงผ่านในเครื่อง
4. Vercel ปิดไว้: "By default, we disable experimental support for requiring ES Modules."
   - https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-node.js-require-of-es-module
   - https://docs.nestjs.com/migration-guide (กรณี Lambda ที่มีพฤติกรรมเดียวกัน)

frame `/opt/rust/*.js` คือ loader ของ Vercel ที่ error ผ่าน ยังไม่มีหลักฐานว่า bytecode caching เป็นต้นเหตุ

## ทางเลือก
| ทาง | ผลกระทบ |
|---|---|
| **A. ตั้ง `NODE_OPTIONS=--experimental-require-module`** (เลือก) | แก้ config บรรทัดเดียว เป็นวิธีที่เอกสาร Vercel ระบุ |
| B. เปลี่ยน `api/` เป็น ESM | ต้องเติม `.js` ใน relative import ทั้งโปรเจกต์ รวม 18 ไฟล์ใน `auth/`, `applications/`, `pets/`, `common/filters/` (ส่วนต้องห้าม) และต้องปรับ Jest |
| C. bundle dependency ด้วย esbuild/webpack | เพิ่มขั้น build และต้องดูแล decorator metadata |
| D. ลงไป NestJS 11 | เปลี่ยน dependency ทั้งชุด |

## ไฟล์ที่จะแก้
- `api/vercel.json`: เพิ่ม `env.NODE_OPTIONS`
  - `env` เป็น property แบบ legacy (ยังรองรับ แต่ Vercel แนะนำให้ตั้งใน Project Settings)
    เลือกใส่ในไฟล์เพื่อให้การแก้อยู่ใน git และมีผลเฉพาะตอนรัน function
  - ถ้า deploy แล้วยังไม่มีผล ให้ตั้งตัวแปรชื่อเดียวกันใน Project Settings

## สำรอง (ยังไม่ใส่)
ผู้ใช้รายหนึ่งใน https://github.com/vercel/vercel/issues/11102 ต้องตั้ง `VERCEL_USE_BYTECODE_CACHING=0` เพิ่ม
เพราะเจอ `SyntaxError: Cannot use import statement outside a module` หลังเปิด flag
ตัวแปรนี้ไม่มีในเอกสาร จึงใช้เฉพาะเมื่อเจออาการนั้น

## วิธีตรวจ
1. `vercel build` ใน Docker (สำเนาไม่มีไฟล์ env) แล้วรัน function บน Node 24 และ 26
   - ปิด `require(esm)` → ต้องได้ `ERR_REQUIRE_ESM` เหมือนบน Vercel
   - ใส่ `NODE_OPTIONS` จาก `vercel.json` → ต้องบูตได้
2. `npm test`, `npm run test:e2e`, `npm run build`, `start:dev`
3. ต้อง deploy จริง: ยืนยันว่า launcher ของ Vercel รับค่านี้

## รอบ 2: `Invalid export found in module` (หลังผ่าน ERR_REQUIRE_ESM)

**สาเหตุ:** `export const config` ใน `src/main.ts` ทำให้ `module.exports` ไม่ว่าง
ซอร์ส launcher สาธารณะของ Vercel (`@vercel/node-bridge` 4.0.1, `launcher.js`) ตัดสินตามลำดับนี้
1. ค่าที่ export มี `.listen` → ใช้เป็น server
2. เป็น function → ใช้เป็น handler
3. object ว่าง → รอให้โค้ดเรียก `app.listen()` (ทางของเรา)
4. อย่างอื่น → `Invalid export found in module` / `The default export must be a function or server.`

runtime จริง (`/opt/rust`) ไม่เปิดซอร์ส แต่พิมพ์ข้อความเดียวกัน
เอกสาร Vercel ไม่ได้เขียนกฎเรื่อง named export ตัวอย่าง NestJS แค่ใช้ `app.listen()` โดยไม่ export

**แก้:** เอา export ออกจาก `main.ts` และคง `NODE_OPTIONS` ไว้

**เวลาสูงสุดของ function:** ใช้ค่าเริ่มต้นของ Fluid compute (Hobby 300 วินาที) ไม่ตั้งในโค้ด
ถ้าต้องการเพดานต่ำลง ให้ตั้ง 60 ที่ Settings → Functions → Advanced Settings → Function Max Duration

**ตรวจ:** รัน function จาก `vercel build` ผ่าน launcher ตัวข้างบน เทียบก่อนและหลังแก้,
ลอง key ของ `functions` ใน `vercel.json`, `npm test`, `test:e2e`, `build`

### ผลตรวจรอบ 2 (2026-11-28)
- function ก่อนแก้ ผ่าน launcher สาธารณะ บน Node 24 และ 26: พิมพ์ `Invalid export found in module` ตรงกับ production
  (launcher ตัวเก่าแค่ log แล้วยังตอบ request ส่วน production จบ process)
- function หลังแก้ ผ่าน launcher เดียวกัน: ไม่มีข้อความนั้น, `/nope` 404, `/notifications` 401, `/health` 503 (ไม่มี DB)
- `functions` ใน `vercel.json` ล้มทุก key ที่ลอง (`src/main.ts`, `src/main.js`, `index`, `src/**`, `**/*.ts`, `api/**`)
- unit 74/74, e2e 3/3, build ผ่าน

## ผลตรวจรอบ 1 (2026-11-28)
- function จาก `vercel build` บน Node 24.22.3 และ 26.13.1: ปิด `require(esm)` ได้ `ERR_REQUIRE_ESM`
  ที่ `@nestjs/common/index.js` จาก `src/main.js` / ใส่ค่าจาก `vercel.json` แล้วบูตได้
- unit 74/74, e2e 3/3, build ผ่าน, `start:dev` (Linux, ค่าปลอม) บูตได้
- `vercel build` ไม่ใส่ `env` ของ `vercel.json` ลงใน output จึงตรวจการส่งค่าตอนรันในเครื่องไม่ได้
- พบเพิ่ม (ยังไม่แก้): `npm ci` ของ `api/` บน Linux (npm 11.19) ล้ม เพราะ lock file ขาด `@emnapi/*`
  ต้องแก้ก่อนทำ CI
