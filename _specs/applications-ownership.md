# Spec for applications-ownership

branch: claude/feature/applications-ownership
ownership: ✍️ developer implements (AI gives hints/review only) — ยกเว้นงาน config (🤖): `PetsModule` เพิ่ม `exports: [PetsService]`

## Summary
- ฟีเจอร์ยื่น/ถอน/ดูคำขอรับเลี้ยงของตัวเองใน `api/src/applications/`
- ผู้พัฒนาเขียน logic เอง AI ทำเฉพาะงาน config ให้ `PetsModule` export `PetsService`
- ยังไม่รวมอนุมัติ/ปฏิเสธ (ขั้น 7)

## Functional Requirements
- ยื่นคำขอ `POST /applications`: ต้อง login, body คือ `petId` + `answers` (โครงตาม Open Questions), `applicant_id` มาจาก `request.user.id` ไม่รับจาก body
- กฎตอนยื่น (ตามลำดับ): สัตว์ไม่มีอยู่ → 404, ขอสัตว์ตัวเอง → 403, สัตว์ไม่ใช่ `available` → 409
- ยื่นด้วยคำสั่ง SQL เดียว (`INSERT ... ON CONFLICT (pet_id, applicant_id) DO UPDATE ... WHERE status = 'withdrawn'`): ไม่เคยยื่น → สร้างใหม่, เคยยื่นแล้วถอน → ปลุกกลับเป็น `pending` พร้อมคำตอบใหม่
- ยื่นซ้ำขณะที่คำขอเดิมไม่ใช่ `withdrawn` → SQL คืน 0 แถว → service โยน 409 เอง
- ถอนคำขอ `PATCH /applications/:id/withdraw`: เฉพาะเจ้าของคำขอ (คนอื่น 403, ไม่พบ 404), ถอนได้เฉพาะ `pending` (สถานะอื่นที่ไม่ใช่ `withdrawn` → 409), ถอนซ้ำที่ `withdrawn` แล้วถือว่าสำเร็จ, SQL ของถอนต้องมี `AND status = 'pending'`
- ดูคำขอของฉัน `GET /applications/mine`: ต้อง login, pagination `limit` / `offset`, ตอบ `{ data, meta: { total, limit, offset } }` และ JOIN `pets` เอา `name` กับ `status` ของสัตว์มาด้วย
- ใช้ตาราง `adoption_applications` ที่มีอยู่ ห้ามเพิ่มคอลัมน์ ไม่แตะ `ai_summaries` ไม่สร้างแจ้งเตือน
- โครงสร้าง controller → service → repository, raw SQL ผ่าน `PG_POOL`, DTO ใช้ class-validator, ตอบ snake_case เหมือน Pets
- ใช้ error filter กลางที่มีอยู่
- โปรเจกต์เป็น CJS

## Possible Edge Cases
- `limit` / `offset` ไม่ใช่ตัวเลขหรือติดลบ (ให้ DTO validate)
- `answers` ไม่ใช่ object หรือฟิลด์ผิดชนิด
- ถอนพร้อมกับเจ้าของอนุมัติ (กันด้วย `AND status = 'pending'` ใน SQL, ขั้น 7 กันเต็มรูปแบบ)

## Acceptance Criteria
- ผู้ใช้ที่ login ยื่นคำขอได้ และ `applicant_id` ตรงกับผู้ใช้ใน token
- กฎตอนยื่นตอบ 404 / 403 / 409 ตามเงื่อนไข
- ยื่นใหม่หลังถอนได้ (สถานะกลับเป็น `pending`), ยื่นซ้ำตอนยัง `pending` ได้ 409
- ถอนได้เฉพาะเจ้าของคำขอที่ยัง `pending` และถอนซ้ำถือว่าสำเร็จ
- `GET /applications/mine` คืนเฉพาะคำขอของผู้ใช้ และ pagination ทำงานถูกต้อง
- endpoint ทั้งหมดถูกปฏิเสธ (401) เมื่อไม่มี token
- `ApplicationsModule` ใช้ `PetsService` ได้หลัง `PetsModule` export

## Open Questions (ตอบแล้ว)
- ถอนแล้วยื่นใหม่: ได้ (ปลุกแถวเดิมกลับเป็น `pending` ด้วย upsert เฉพาะแถวที่ `withdrawn`)
- `answers` โครงตายตัว: `housingType` ('house' | 'condo' | 'apartment' | 'other'), `hasPetExperience` (boolean), `note?` (string ไม่เกิน 500 ตัวอักษร)
- `GET /applications/mine`: ตอบ `{ data, meta }` และ JOIN `pets` เอา `name`, `status` ของสัตว์

## Testing Guidelines
List the test cases only.
- Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- ยื่นคำขอ: สัตว์ไม่มีอยู่ → 404, ขอสัตว์ตัวเอง → 403, สัตว์ไม่ใช่ `available` → 409
- ยื่นคำขอ: `applicant_id` ใช้ค่าจากผู้เรียก (token) ไม่ใช่จาก body
- ยื่นคำขอ: repository ไม่คืนแถว (ยื่นซ้ำ) → 409
- ถอนคำขอ: เจ้าของถอนได้, คนอื่น → 403, ไม่พบ → 404
- ถอนคำขอ: สถานะอื่นที่ไม่ใช่ `pending`/`withdrawn` → 409, ถอนซ้ำที่ `withdrawn` สำเร็จ
- ดูคำขอของฉัน: คืนเฉพาะของผู้ใช้ที่ login   