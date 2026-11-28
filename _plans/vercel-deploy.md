# Plan: เตรียม deploy บน Vercel (roadmap ข้อ 13 ส่วน deploy)

ขอบเขต: เตรียมโค้ดและ config เท่านั้น **ไม่ deploy ไม่ commit** CI อยู่นอกรอบนี้
ไม่แตะ `auth/`, `applications/`, `pets/`, `worker/`, `common/filters/`

## สิ่งที่ตรวจพบ (เอกสาร Vercel/Neon ณ 2026-11-28 + build จำลองด้วย Vercel CLI 68.0.0)
- NestJS บน Vercel เป็น zero-config: ตรวจเจอ `src/main.ts` เอง ใช้ `app.listen()` ได้ ทั้งแอปเป็น 1 function
- `vercel.json` แบบ `functions["src/main.ts"]` ทำให้ build ล้ม (`unused_function`)
  ส่วน `export const config = { maxDuration: 60 }` ใน `main.ts` ผ่าน build แต่**ทำให้ล้มตอนรันจริง**
  (`Invalid export found in module`) จึงเอาออกแล้ว ดู `_plans/vercel-esm-fix.md`
- Hobby + Fluid compute: ค่าเริ่มต้นและสูงสุด 300 วินาที, region ได้ 1 แห่ง, ค่าเริ่มต้นคือ `iad1`
- API ยังไม่เปิด CORS
- `PORT` เป็นตัวแปรบังคับ และเอกสารไม่ได้ระบุว่า Vercel ตั้งให้
- Vercel CLI อัปโหลด `.env`, `.env.test`, `.env.neon` ถ้าไม่มี `.vercelignore`

## ไฟล์ที่จะแก้/เพิ่ม
| ไฟล์ | ทำอะไร |
|---|---|
| `api/vercel.json` (ใหม่) | `framework: nestjs`, `regions: ["sin1"]` |
| `api/.vercelignore` (ใหม่) | กันไฟล์ env และ build output ไม่ให้ถูกอัปโหลด |
| `api/src/main.ts` | เปิด CORS เมื่อมี `CORS_ORIGIN` (ไฟล์นี้ห้าม export อะไร) |
| `api/src/config/env.ts` | เพิ่ม `CORS_ORIGIN`, `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS` (ไม่บังคับ), `PORT` มีค่าเริ่มต้น 3000 |
| `api/src/config/env.spec.ts` | เทสต์ของตัวแปรใหม่ |
| `api/src/database/database.module.ts` | อ่านขนาด pool และ timeout จาก env (ค่าเริ่มต้น 10 / 2000ms เท่าเดิม) |
| `api/.env.example` | อธิบายตัวแปรใหม่ |
| `web/vercel.json` (ใหม่) | rewrite ทุก path ไป `/index.html` |
| `web/src/lib/api/client.ts` | ตัด `/` ท้าย `VITE_API_BASE_URL` |
| `web/.env.example` | อธิบายวิธีตั้งบน Vercel |

## การตัดสินใจ
- **เวลาสูงสุดของ function**: ไม่ตั้งในโค้ด ใช้ค่าเริ่มต้นของ Fluid compute (Hobby 300 วินาที)
  ซึ่งมากกว่า cold start + ต่อ DB + AI 15 วินาที ถ้าต้องการเพดาน 60 ให้ตั้งใน dashboard
- **CORS**: ไม่ตั้ง = ปิด (เหมือนเดิม), ตั้งได้หลาย origin คั่นด้วย `,`, ปฏิเสธ `*` ตั้งแต่ตอนบูต
- **pool บน Vercel**: แนะนำ `DB_POOL_MAX=5`, `DB_CONNECTION_TIMEOUT_MS=10000`
- ยังไม่เพิ่ม `attachDatabasePool` (`@vercel/functions`) และไม่เปลี่ยน timeout 2000ms ของ `/health` — รายงานเป็นความเสี่ยง

## วิธีตรวจ
1. `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build` (api และ web)
2. รัน `npm run start:dev` ด้วยค่าปลอมจาก env ของ process แล้วยิง `/health`
3. `vercel build` ในเครื่อง (Docker, สำเนาที่ไม่มี `.env`) แล้วรัน function ที่ build ได้ ตรวจ CORS
4. `vercel build` ของ web: ตรวจ route rewrite ใน output และค้น `localhost` ใน bundle

## ผลตรวจ (2026-11-28)
- unit 74/74, e2e 3/3, build ผ่านทั้งสองฝั่ง, lint เหลือแค่ warning เดิมนอกไฟล์ที่แก้
- function ที่ build ได้ (รันด้วย `node` ตรงๆ ไม่ผ่าน launcher): บูตได้แม้ไม่ตั้ง `PORT`,
  CORS อนุญาตเฉพาะ origin ที่ตั้ง, `DB_CONNECTION_TIMEOUT_MS` มีผลจริง
  การตรวจนี้ไม่เจอปัญหาสองข้อที่พบตอน deploy จริง (ดู `_plans/vercel-esm-fix.md`)
- `start:dev` ด้วยค่าปลอม: บูตได้, CORS ปิด, timeout 2000ms เท่าเดิม
- web: filesystem มาก่อน rewrite ไป `/index.html`; `localhost` ใน bundle มาจากโค้ดภายในของ library เท่านั้น
- ยังพิสูจน์ในเครื่องไม่ได้: region `sin1`, refresh หน้าลึกบนโดเมนจริง, ต่อ Neon จากบน Vercel
