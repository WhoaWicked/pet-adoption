# Spec for frontend-mvp

branch: claude/feature/frontend-mvp
ownership: 🤖 AI may implement — เฉพาะใน `web/` เท่านั้น ห้ามแตะ `api/` เด็ดขาด

## Summary
- หน้าเว็บขั้นต่ำของ Pet Adoption Platform ใน `web/` ให้ใช้งาน flow หลักได้ครบ เพื่อ demo ใน portfolio (roadmap ข้อ 9–10)
- Server state ใช้ TanStack Query ครอบ fetch client (auth/UI state ใช้ React context ธรรมดา), ไม่ใช้ axios
- เรียก API ผ่าน api client ตัวเดียวด้วย `fetch` และใช้ Vite dev proxy เลี่ยง CORS ตอน dev (API ไม่ได้เปิด CORS และไม่มี global prefix)
- โทนอบอุ่น เป็นมิตร เรียบ สะอาด ใช้ design token ชุดเดียวทั้งแอป (ใช้ skill frontend-design ตอนลงมือ)
- ไม่ทำ: image upload, real-time, i18n, dark mode, การแสดง AI summary (API ยังไม่มี endpoint)
- Stack: React + Vite + TypeScript, react-router, Tailwind CSS + shadcn/ui, TanStack Query สำหรับ server state ครอบ fetch client (auth/UI state ใช้ React context ธรรมดา), ไม่ใช้ axios

## Functional Requirements

### API contract (ยืนยันจาก controller / DTO / service ใน `api/src/**` แล้ว)
- ทั่วไป
  - Request body เป็น camelCase, response row เป็น snake_case (ยกเว้น login ที่ตอบ `{ accessToken }`)
  - Error shape: `{ statusCode, error, message, details? }` — validation error มี `error = VALIDATION_FAILED` และรายละเอียดใน `details`
  - API ใช้ `forbidNonWhitelisted` → ห้ามส่ง field เกินจาก DTO และห้ามส่ง query param ค่าว่าง (เช่น `province=`) ให้ตัด param นั้นทิ้งไปเลย
  - Path param ที่เป็น UUID ผ่าน `ParseUUIDPipe` → id ผิดรูปแบบได้ 400
- Auth
  - `POST /auth/register` body `{ email, password (≥ 8 ตัว), displayName }` → ตอบ user (`id`, `email`, `display_name`) ไม่มี token
  - `POST /auth/login` body `{ email, password }` → `{ accessToken }` (หมดอายุ 1 ชั่วโมง), ผิด → 401 "Invalid email or password"
  - `GET /auth/me` (ต้อง login) → `{ id }` เท่านั้น ใช้หา user id ของตัวเองเพื่อเทียบ `owner_id`
- Pets
  - `POST /pets` (login) body `{ name, species: dog|cat|other, ageMonths (int ≥ 0), province, description, requirements, imageUrl? }` → pet row
  - `GET /pets` query `species?`, `province?`, `limit` (1–50, default 20), `offset` (≥ 0) → `{ data, meta: { total, limit, offset } }` แสดงเฉพาะ `available`
  - `GET /pets/mine` (login) → array ของ pet row ของผู้ใช้ **ทุกสถานะ** เรียงใหม่สุดก่อน ไม่มี `meta` ไม่มี pagination — ผู้พัฒนาเพิ่มเองใน `api/` ให้อ่านรูปแบบจริงจาก controller เมื่อพร้อม ห้ามเดา
  - `GET /pets/:id` (ไม่ต้อง login) → pet row ทุกสถานะ, ไม่พบ → 404
  - `PATCH /pets/:id/close` (login, เจ้าของ) → pet row; ไม่ใช่เจ้าของ 403, adopted แล้ว 409, closed อยู่แล้วตอบสำเร็จ
  - `PUT /pets/:id/save` / `DELETE /pets/:id/save` (login) → body ว่าง, ทำซ้ำได้ (idempotent)
  - `GET /pets/saved` (login) → array ของ pet row (ไม่มี `meta`, ไม่มี pagination) ทุกสถานะ
- Applications
  - `POST /applications` body `{ petId, answers: { housingType: house|condo|apartment|other, hasPetExperience: boolean, note? (≤ 500) } }`
    - ขอสัตว์ตัวเอง 403, สัตว์ไม่ available 409, ยื่นซ้ำ 409
  - `GET /applications/mine` query `limit` / `offset` → `{ data, meta }` แต่ละรายการมี `pet_name`, `pet_status`
  - `PATCH /applications/:id/withdraw` (ผู้ยื่น) — ไม่ใช่ pending → 409
  - `GET /applications/pet/:petId` (เจ้าของ) → array (ไม่มี pagination) แต่ละรายการมี `applicant_name`, `answers`, `status`; ไม่ใช่เจ้าของ 403
  - `PATCH /applications/:id/approve` / `reject` (เจ้าของ) — ไม่ใช่ pending → 409; approve สำเร็จจะทำให้คำขออื่นเป็น rejected และสัตว์เป็น adopted
- Notifications (ต้อง login ทั้งหมด)
  - `GET /notifications` query `limit` / `offset` → `{ data, meta }`, `id` เป็น string, มี `type`, `entity_id`, `message` (อังกฤษ), `read_at`, `created_at`
  - `GET /notifications/unread-count` → `{ count }`
  - `PATCH /notifications/:id/read` → notification row, ไม่พบ/ไม่ใช่ของตัวเอง → 404, กดซ้ำได้
  - `type` ที่มี: `application.received` (ไปหาเจ้าของ), `application.approved`, `application.rejected` (ไปหาผู้ยื่น) — `entity_id` เป็น id ของ **คำขอ** เสมอ ไม่ใช่ id ของสัตว์

### โครงพื้นฐาน
- Vite dev proxy: เรียกผ่าน prefix เดียว (เช่น `/api`) แล้ว rewrite ตัด prefix ออกก่อนส่งไป API; base URL ตอน production อ่านจาก env ของ Vite (ไม่ใช่ secret)
- api client ตัวเดียว
  - ใส่ `Authorization: Bearer <token>` เมื่อมี token
  - สร้าง query string โดยตัด key ที่ค่าว่าง / undefined ทิ้ง
  - รองรับ response body ว่าง (save/unsave)
  - แปลง error response เป็น error object ที่มี `statusCode`, `error`, `message`, `details`
  - ได้ 401 จาก request ที่ส่ง token ไป → logout แล้วพาไปหน้า login (จำหน้าที่ค้างไว้เพื่อกลับมาหลัง login); 401 จากการ login เองต้องไม่ trigger logic นี้
- Auth context: เก็บ token (localStorage), user id (จาก `/auth/me`), สถานะ login, ฟังก์ชัน login / logout
- Protected route: หน้าที่ต้อง login ถ้ายังไม่ login → ไปหน้า login แล้วกลับมาหน้าเดิมหลัง login สำเร็จ
- ข้อความ error: map ตาม status ให้อ่านรู้เรื่องเป็นภาษาไทย (เช่น 409 "ยื่นคำขอสัตว์ตัวนี้ไปแล้ว", 403 "คุณไม่มีสิทธิ์ทำรายการนี้", 404 "ไม่พบข้อมูล") และใช้ `message` จาก API เป็นตัวแยกกรณีย่อยของ 409 ที่รู้จัก ถ้าไม่รู้จักให้แสดง `message` ตามที่ API ส่งมา
- validation error (`VALIDATION_FAILED`) แสดงใต้ field ที่เกี่ยวข้องเมื่อจับคู่ได้ ไม่งั้นแสดงเป็นข้อความรวมของฟอร์ม
- รายชื่อจังหวัดไทย 77 จังหวัดเป็นค่าคงที่ใน `web/` ใช้ทั้ง dropdown filter และฟอร์มสร้างโพสต์ เพื่อให้สะกดตรงกัน (filter เทียบแบบตรงตัว)
- label ภาษาไทยของ enum: species, pet status, application status, housingType

### หน้า
1. **Login / Register**
   - Register สำเร็จ → login ให้อัตโนมัติด้วย email/password เดิม (register ไม่คืน token) แล้วพาไปหน้าแรก
   - ตรวจฟอร์มฝั่ง client ขั้นต้น (email, password ≥ 8, displayName ไม่ว่าง)
2. **รายการสัตว์ (หน้าแรก)**
   - การ์ดรูปใหญ่ (placeholder ถ้าไม่มี `image_url`), ชื่อ, จังหวัด, อายุ, ป้ายสถานะ
   - filter species + province (dropdown, มีตัวเลือก "ทั้งหมด" = ไม่ส่ง param)
   - pagination ด้วย limit/offset จาก `meta.total`; filter และหน้าปัจจุบันสะท้อนใน URL query เพื่อ refresh/แชร์ลิงก์ได้; เปลี่ยน filter แล้วกลับหน้าแรก
3. **รายละเอียดสัตว์** (ไม่ต้อง login เพื่อดู)
   - ข้อมูลครบ: รูป, ชื่อ, ชนิด, อายุ (แสดงเป็นปี/เดือน), จังหวัด, คำอธิบาย, เงื่อนไขการรับเลี้ยง, ป้ายสถานะ
   - ปุ่มบันทึก/เลิกบันทึก (สถานะเริ่มต้นดูจาก `GET /pets/saved`); ยังไม่ login → กดแล้วพาไป login
   - ฟอร์มยื่นคำขอ (housingType, hasPetExperience, note ≤ 500 พร้อมตัวนับ) แสดงเมื่อสัตว์ `available` และผู้ใช้ไม่ใช่เจ้าของ; ยื่นสำเร็จแสดงข้อความยืนยันและลิงก์ไป "คำขอของฉัน"
   - ถ้าเป็นเจ้าของ: แทนฟอร์มด้วยลิงก์ไปหน้าจัดการ
   - สัตว์ที่ไม่ available แสดงข้อความ "ปิดรับแล้ว" / "มีบ้านแล้ว" แทนฟอร์ม
4. **สร้างโพสต์สัตว์** (ต้อง login) — ฟอร์มตาม DTO, `imageUrl` เป็นช่อง URL ไม่บังคับ (ไม่มี upload), province เป็น dropdown; สำเร็จ → ไปหน้าจัดการของสัตว์ที่สร้าง (หรือหน้ารายละเอียด)
5. **คำขอของฉัน** (ต้อง login) — รายการพร้อมชื่อสัตว์ (ลิงก์ไปหน้ารายละเอียด), สถานะคำขอ, วันที่ยื่น, pagination; ปุ่มถอนเฉพาะ `pending` พร้อม confirm; หลังสำเร็จอัปเดตสถานะในรายการ
6. **สัตว์ของฉัน** (ต้อง login)
   - **หน้ารายการ `/my-pets`**: ดึงจาก `GET /pets/mine` แสดงการ์ดสัตว์ของผู้ใช้ทุกสถานะ พร้อมป้ายสถานะ, กดแล้วเข้าหน้าจัดการ; มี empty state พร้อมลิงก์ไป "ลงประกาศ"
   - **หน้าจัดการต่อสัตว์ 1 ตัว `/my-pets/:petId`**: ข้อมูลสัตว์ + ปุ่มปิดโพสต์ (confirm, ซ่อนเมื่อ adopted/closed) + รายการคำขอ (ชื่อผู้ยื่นจาก `applicant_name`, คำตอบ, สถานะ, วันที่) + ปุ่มอนุมัติ/ปฏิเสธเฉพาะ `pending` (อนุมัติต้อง confirm และบอกว่าคำขออื่นจะถูกปฏิเสธ); หลัง action โหลดข้อมูลใหม่ทั้งสัตว์และคำขอ; ไม่ใช่เจ้าของ → แสดง 403 ที่อ่านรู้เรื่อง
   - ระหว่างที่ `GET /pets/mine` ยังไม่พร้อม ให้ทำหน้าจัดการต่อสัตว์ 1 ตัวก่อน แล้วค่อยต่อหน้ารายการ
7. **สัตว์ที่บันทึกไว้** (ต้อง login) — การ์ดแบบเดียวกับหน้ารายการ แสดงทุกสถานะ มีป้าย "ปิดรับแล้ว" / "มีบ้านแล้ว" สำหรับที่ไม่ available, เลิกบันทึกได้จากหน้านี้
8. **กระดิ่งแจ้งเตือนใน header** (แสดงเมื่อ login)
   - badge จาก `unread-count` ใช้ `refetchInterval` ~30 วินาที (ปิดเมื่อ logout), ซ่อน badge เมื่อเป็น 0, แสดง "9+" เมื่อเกิน
   - เปิด dropdown/popover แสดงรายการล่าสุด แยกที่ยังไม่อ่านให้เห็นชัด, ข้อความแสดงเป็นภาษาไทยตาม `type` (ไม่ใช้ `message` อังกฤษตรง ๆ)
   - กดแล้ว mark read (ถ้ายังไม่อ่าน) ลด badge ทันที แล้วนำทาง: `application.approved` / `application.rejected` → หน้า "คำขอของฉัน" (ไม่ต้องไฮไลต์), `application.received` → หน้ารายการ "สัตว์ของฉัน" (`/my-pets`)
- Header: โลโก้/ชื่อเว็บ, ลิงก์หลัก (หน้าแรก, ลงประกาศ, คำขอของฉัน, ที่บันทึกไว้, สัตว์ของฉัน), กระดิ่ง, ปุ่ม login/logout (ไม่แสดงชื่อผู้ใช้ เพราะ `/auth/me` ไม่คืน `display_name`); บนมือถือยุบเป็นเมนู
   - mark read ใช้ mutation แล้ว invalidate query ของ `unread-count` และรายการแจ้งเตือน (ถ้าทำง่ายให้ update cache ของ badge ทันทีแบบ optimistic)

### Design
- สีหลัก 1 สี (โทนอุ่น) + พื้นหลังขาวนวล ใช้สีหลักเฉพาะปุ่มสำคัญ (ยื่นคำขอ, อนุมัติ, ลงประกาศ, login)
- ฟอนต์ Noto Sans Thai (+ Inter สำหรับตัวเลข/ละติน ถ้าต้องการ), ระยะห่างโปร่ง, มุมโค้งสม่ำเสมอ
- design token เป็น CSS variables ชุดเดียว ผูกเข้ากับ theme ของ Tailwind/shadcn
- ใช้ component ของ shadcn/ui (Button, Card, Badge, Input, Select, Textarea, Dialog/AlertDialog, Popover, Skeleton, Toast) เขียน CSS เองเฉพาะที่จำเป็น
- ป้ายสถานะมีสีแยกตามสถานะแต่ไม่แย่งความเด่นจากสีหลัก

## Possible Edge Cases
- query param ค่าว่างจาก filter "ทั้งหมด" หรือ URL ที่ผู้ใช้แก้เอง → ต้องตัดทิ้ง ไม่ส่งไป API
- `offset` ใน URL เกินจำนวนจริง → แสดง empty state พร้อมปุ่มกลับหน้าแรก
- id ใน URL ไม่ใช่ UUID → API ตอบ 400 ต้องแสดงเป็น "ไม่พบข้อมูล" แทน error ทางเทคนิค
- token หมดอายุระหว่างใช้งาน (1 ชั่วโมง) → request ถัดไปได้ 401 → logout + ไป login แล้วกลับหน้าเดิม; poll ของกระดิ่งก็ต้องเข้าเงื่อนไขนี้โดยไม่เด้งซ้ำหลายครั้ง
- token ใน localStorage เสีย/หมดอายุตอนเปิดเว็บใหม่ → `/auth/me` ได้ 401 → เคลียร์ token เงียบ ๆ ไม่ต้องเด้งถ้าอยู่หน้าสาธารณะ
- กดปุ่ม action ซ้ำเร็ว ๆ → ปุ่ม disable ระหว่างรอ ส่งได้ครั้งเดียว
- ยื่นคำขอแล้วได้ 409 เพราะสัตว์ถูกรับเลี้ยงไปแล้วระหว่างกรอก → แสดงข้อความและโหลดสถานะสัตว์ใหม่
- เคยยื่นแล้วถอน แล้วยื่นใหม่ → ให้ API เป็นคนตัดสิน แสดงผลตาม response
- อนุมัติพร้อมกันจากสองแท็บ → แท็บที่แพ้ได้ 409 แสดงข้อความแล้วโหลดรายการคำขอใหม่
- ปิดโพสต์สัตว์ที่ adopted แล้ว → 409 แสดงข้อความที่อ่านรู้เรื่อง
- เปิดหน้าจัดการของสัตว์ที่ไม่ใช่ของตัวเอง → 403
- ยังไม่มีสัตว์ของฉันเลย (`GET /pets/mine` คืน array ว่าง) → empty state พร้อมลิงก์ไปลงประกาศ
- mark read ล้มเหลว (เช่น 404) → ยังนำทางต่อได้ และ refresh จำนวน unread
- `image_url` ใช้ไม่ได้ (โหลดรูปไม่ขึ้น) → fallback เป็น placeholder
- note ยาวเกิน 500 → กันที่ฝั่ง client ก่อนส่ง
- ข้อความยาว/ไม่มีช่องว่าง (เช่น description) ต้องไม่ทำให้ layout ล้นบนมือถือ

## Acceptance Criteria
- `web/` รัน dev ได้และเรียก API ผ่าน Vite proxy โดยไม่แก้ไฟล์ใดใน `api/`
- flow demo ครบ end-to-end: register → login → ลงประกาศ → (ผู้ใช้อีกคน) ดูรายการ/filter → ดูรายละเอียด → บันทึก → ยื่นคำขอ → (เจ้าของ) เห็นกระดิ่งเด้ง → เปิดรายการสัตว์ของฉัน → เข้าหน้าจัดการ → อนุมัติ → (ผู้ยื่น) เห็นแจ้งเตือนอนุมัติ → คำขอของฉันแสดง approved และสัตว์แสดง "มีบ้านแล้ว"
- ไม่มี request ใดส่ง query param ค่าว่าง และไม่มี body ที่มี field เกิน DTO
- ทุกหน้ามี loading, empty และ error state
- error 403 / 404 / 409 แสดงเป็นข้อความภาษาไทยที่อ่านรู้เรื่อง ไม่ใช่ JSON หรือ stack
- 401 จาก request ที่มี token → logout และไปหน้า login แล้วกลับหน้าเดิมหลัง login ได้
- ปุ่ม action ทุกปุ่ม disable ระหว่างรอ
- badge กระดิ่งอัปเดตภายใน ~30 วินาทีโดยไม่ refresh หน้า และลดลงทันทีเมื่อกดอ่าน
- สัตว์ที่บันทึกไว้แสดงทุกสถานะพร้อมป้ายที่ถูกต้อง
- หน้า "สัตว์ของฉัน" แสดงสัตว์ของผู้ใช้ทุกสถานะ
- ใช้งานได้ที่ความกว้างมือถือ (~375px) โดยไม่มี horizontal scroll
- สีทั้งหมดมาจาก design token ชุดเดียว ไม่มีสี hard-code กระจายในหน้า
- ไม่มี secret ใดอยู่ใน `web/` (มีแค่ base URL ของ API)
- TypeScript build ผ่านโดยไม่มี error

## Open Questions (ตอบแล้ว)
- **รายการ "สัตว์ของฉัน"**: ผู้พัฒนาเพิ่ม `GET /pets/mine` เองใน `api/` (ต้อง login, คืน array ของ pet row ของผู้ใช้ **ทุกสถานะ**, เรียงใหม่สุดก่อน, ไม่มี pagination/`meta`) → frontend ทำเมนูและหน้ารายการ "สัตว์ของฉัน" ได้ตามปกติ
  - ระหว่างที่ endpoint ยังไม่พร้อม ให้ทำหน้าจัดการต่อสัตว์ 1 ตัว (`/my-pets/:petId`) ก่อน แล้วค่อยต่อหน้ารายการเมื่อ endpoint พร้อม (อ่านรูปแบบจริงจาก controller ห้ามเดา)
  - หน้าจัดการต่อสัตว์ 1 ตัว เข้าได้จากหน้ารายการสัตว์ของฉัน, จากหน้ารายละเอียดเมื่อ `owner_id` ตรงกับ user id, และหลังสร้างโพสต์สำเร็จ
- **แจ้งเตือน `application.received`**: นำทางไปหน้ารายการ "สัตว์ของฉัน" (ไม่ต้องแก้ `api/` เพิ่ม และไม่ต้องหา pet id จาก notification)
- **`/auth/me` ไม่คืน `display_name`**: ยอมรับ — header ไม่ต้องแสดงชื่อผู้ใช้ (แสดงแค่ปุ่ม logout)
- **`PetsApplicationRow`**: frontend ใช้ `applicant_name` ตามข้อมูลจริง ผู้พัฒนาจะแก้ type ใน `api/` เอง
- **deploy / CORS**: อยู่นอกขอบเขต spec นี้ (ครอบคลุมแค่ dev proxy) จะตัดสินใจตอนทำ deploy
- **AI summary**: ไม่ทำใน MVP นี้ (ไม่มี endpoint)

## Testing Guidelines
List the test cases only. ห้ามเขียนโค้ดเทสต์ในขั้น implement — ใช้ manual demo checklist ท้ายรายการเป็นตัวตรวจ
- Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- api client
  - ใส่ header `Authorization` เมื่อมี token และไม่ใส่เมื่อไม่มี
  - ตัด query param ที่เป็น `''` / `undefined` / `null` ออก
  - response body ว่างไม่ทำให้ parse พัง
  - error response ถูกแปลงเป็น error object ที่มี `statusCode`, `error`, `message`, `details`
  - 401 จาก request ที่มี token → เรียก logout และ redirect ไป login พร้อมจำหน้าเดิม
  - 401 จาก `POST /auth/login` → ไม่ redirect แต่ส่ง error กลับให้ฟอร์มแสดง
  - network error (fetch reject) → แสดงข้อความ "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"
- error message mapping: 403 / 404 / 409 (แต่ละ message ที่รู้จัก) / 400 UUID ผิด / VALIDATION_FAILED / status ที่ไม่รู้จัก
- auth context: login เก็บ token, logout เคลียร์ token และ user, เปิดเว็บใหม่พร้อม token หมดอายุ → เคลียร์เงียบ ๆ
- protected route: ยังไม่ login → ไป login; login แล้วกลับหน้าเดิม
- register: สำเร็จแล้ว auto-login, email ซ้ำแสดง error, password < 8 ถูกกันฝั่ง client
- รายการสัตว์: loading / empty / error, filter "ทั้งหมด" ไม่ส่ง param, เปลี่ยน filter รีเซ็ตหน้า, pagination คำนวณจาก `meta.total`, state อยู่ใน URL
- การ์ดสัตว์: ไม่มี `image_url` หรือรูปโหลดไม่ขึ้น → placeholder, ป้ายสถานะถูกต้องทั้ง 3 สถานะ
- รายละเอียดสัตว์: 404 แสดงหน้าไม่พบ, ฟอร์มยื่นแสดง/ซ่อนตามสถานะสัตว์และความเป็นเจ้าของ, ปุ่มบันทึกสลับสถานะ, ยังไม่ login กดบันทึกพาไป login
- ฟอร์มยื่นคำขอ: ส่ง body ตรง DTO (ไม่มี field เกิน), note > 500 ถูกกัน, 409 ยื่นซ้ำ / สัตว์ไม่ available แสดงข้อความ, ปุ่ม disable ระหว่างส่ง
- สร้างโพสต์: ส่ง `ageMonths` เป็นตัวเลข, ไม่ส่ง `imageUrl` เมื่อว่าง, สำเร็จพาไปหน้าจัดการ/รายละเอียด
- คำขอของฉัน: ปุ่มถอนเฉพาะ pending, ถอนสำเร็จอัปเดตสถานะ, 409 แสดงข้อความ
- สัตว์ของฉัน (รายการ): แสดงทุกสถานะพร้อมป้าย, empty state, กดแล้วเข้าหน้าจัดการ
- หน้าจัดการ: ปุ่มอนุมัติ/ปฏิเสธเฉพาะ pending, อนุมัติแล้วโหลดใหม่เห็นคำขออื่นเป็น rejected และสัตว์เป็น adopted, 409 จากการอนุมัติชนกันแสดงข้อความและโหลดใหม่, ปิดโพสต์ 409 เมื่อ adopted, ไม่ใช่เจ้าของเห็น 403
- สัตว์ที่บันทึกไว้: แสดงทุกสถานะพร้อมป้าย, เลิกบันทึกแล้วหายจากรายการ, empty state
- กระดิ่ง: badge ซ่อนเมื่อ 0 / แสดง "9+", poll ทุก ~30 วินาทีและหยุดเมื่อ logout, กดอ่านลด badge และนำทางตาม `type` (approved/rejected → คำขอของฉัน, received → สัตว์ของฉัน), mark read ล้มเหลวยังนำทางได้
- responsive: หน้าหลักทุกหน้าที่ความกว้าง ~375px ไม่มี horizontal scroll, เมนู header ยุบบนมือถือ
- manual demo checklist: เดิน flow ตาม Acceptance Criteria ข้อ 2 ด้วยผู้ใช้ 2 คนใน 2 browser profile