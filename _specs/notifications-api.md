# Spec for notifications-api

branch: claude/feature/notifications-api
ownership: แยกสองส่วน — ส่วนอ่าน 🤖 AI may implement (`api/src/notifications/`) | ส่วนสร้าง ✍️ developer implements (AI gives hints/review only) (`api/src/applications/`)

## Summary
- แจ้งเตือนในแอป: API อ่าน/นับ/กดอ่าน และการสร้างแจ้งเตือนจากการเปลี่ยนสถานะคำขอ (ขั้น 8)
- ส่วนอ่านให้ AI เขียน ส่วนสร้างผู้พัฒนาเขียนเอง (อยู่ในส่วนต้องห้ามของ `applications/`)
- ไม่ทำอีเมล, push, real-time

## Functional Requirements
- ส่วนอ่าน 🤖 (`api/src/notifications/`, controller → service → repository, raw SQL ผ่าน `PG_POOL`):
  - `GET /notifications`: ของฉัน ใหม่สุดก่อน, pagination `limit` / `offset`, ตอบ `{ data, meta: { total, limit, offset } }`
  - `GET /notifications/unread-count`: ตอบ `{ count }` (นับเฉพาะ `read_at IS NULL`)
  - `PATCH /notifications/:id/read`: เฉพาะของตัวเอง, ไม่ใช่ของตัวเองหรือไม่พบ → 404, กดซ้ำถือว่าสำเร็จ (ไม่เขียนทับ `read_at` เดิม)
- ส่วนสร้าง ✍️ (`api/src/applications/`) ใน transaction เดียวกับการเปลี่ยนสถานะ:
  - approve: ผู้ยื่นที่ถูกอนุมัติ → `application.approved`, ผู้ยื่นที่ถูกปฏิเสธอัตโนมัติทุกคน → `application.rejected`
  - reject: ผู้ยื่น → `application.rejected`
  - create (ยื่น / ยื่นใหม่หลังถอน): เจ้าของสัตว์ → `application.received`
- ใช้ตาราง `notifications` เดิม ห้ามเพิ่มคอลัมน์: `entity_id` = id ของคำขอ, `message` เป็นอังกฤษสั้น ๆ
- ทุก endpoint ต้อง login, ตอบ snake_case, ใช้ error filter กลางที่มีอยู่, โปรเจกต์เป็น CJS

## Possible Edge Cases
- `limit` / `offset` ไม่ใช่ตัวเลขหรือติดลบ (ให้ DTO validate)
- `:id` ไม่ใช่ตัวเลข (`notifications.id` เป็น `BIGSERIAL` ไม่ใช่ UUID) → 400
- ถ้าสร้างแจ้งเตือนล้มกลางทาง การเปลี่ยนสถานะต้อง rollback ด้วย

## Acceptance Criteria
- รายการ/จำนวนที่ยังไม่อ่าน/กดอ่าน เห็นและแก้ได้เฉพาะของตัวเอง
- กดอ่านของคนอื่นหรือ id ที่ไม่มี → 404, กดอ่านซ้ำ → สำเร็จ
- ไม่มี token → 401 ทุก endpoint
- ยื่น/อนุมัติ/ปฏิเสธสร้างแจ้งเตือนครบตามชนิดและผู้รับ พร้อมกับการเปลี่ยนสถานะ ไม่มีแจ้งเตือนค้างเมื่อ rollback

## Open Questions
- ไม่มี

## Testing Guidelines
List the test cases only.
- Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- รายการ: คืนเฉพาะของผู้ใช้ เรียงใหม่สุดก่อน และ pagination/`meta` ถูกต้อง
- unread-count: นับเฉพาะที่ `read_at` เป็น null ของผู้ใช้คนนั้น
- กดอ่าน: ของตัวเองสำเร็จ และตั้ง `read_at`
- กดอ่านซ้ำ: สำเร็จและ `read_at` ไม่เปลี่ยน
- กดอ่านของคนอื่นหรือไม่พบ → 404
- ทุก endpoint ไม่มี token → 401
- อนุมัติ: ผู้ถูกอนุมัติได้ application.approved 1 อัน, ผู้ถูกปฏิเสธอัตโนมัติทุกคนได้ application.rejected, คนที่ withdrawn ไม่ได้แจ้งเตือน
- Rollback: บังคับให้ insert notification พัง → คำขอ/สัตว์ไม่เปลี่ยน และไม่มี notification ค้าง
- อนุมัติ: notification ทุกอันมี entity_id = id ของคำขอที่เกี่ยวข้อง และ user_id = ผู้ยื่นของคำขอนั้น
