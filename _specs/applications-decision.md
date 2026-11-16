# Spec for applications-decision

branch: claude/feature/applications-decision
ownership: ✍️ developer implements (AI gives hints/review only) — ยกเว้นงาน config (🤖): database สำหรับเทสต์ (docker-compose service + `.env.test` + npm script)

## Summary
- เจ้าของสัตว์ดูคำขอทั้งหมดของสัตว์ตัวเอง และอนุมัติ/ปฏิเสธคำขอ (ขั้น 7)
- ผู้พัฒนาเขียน logic และเทสต์เอง AI ทำเฉพาะงาน config ของ database สำหรับเทสต์

## Functional Requirements
- ดูคำขอของสัตว์ `GET /applications/pet/:petId`: ต้อง login, ไม่พบสัตว์ → 404, ไม่ใช่เจ้าของ → 403
- อนุมัติ `PATCH /applications/:id/approve` ใน transaction เดียว: (1) คำขอนี้เป็น `approved` + `decided_at` (2) คำขออื่นของสัตว์ตัวเดียวกันที่ยัง `pending` เป็น `rejected` (3) สัตว์เป็น `adopted` — สำเร็จหรือล้มพร้อมกัน
- ปฏิเสธ `PATCH /applications/:id/reject`: เฉพาะคำขอที่ยัง `pending`
- กฎทั้งสอง endpoint: ไม่พบคำขอ → 404, ไม่ใช่เจ้าของสัตว์ → 403, คำขอไม่ใช่ `pending` หรือสัตว์ไม่ใช่ `available` → 409
- กดอนุมัติพร้อมกันหลายคำขอของสัตว์ตัวเดียว ต้องสำเร็จได้แค่ 1 (วิธีป้องกันให้ผู้พัฒนาเลือกเอง)
- ใช้ตารางเดิม ห้ามเพิ่มคอลัมน์ ไม่ทำแจ้งเตือน ไม่ทำ activity log
- ตอบ snake_case, ใช้ error filter กลางที่มีอยู่, โปรเจกต์เป็น CJS
- งาน config (🤖): database แยกจาก dev สำหรับเทสต์ — service ใน `docker-compose`, ไฟล์ `.env.test`, npm script สำหรับรัน integration test

## Possible Edge Cases
- คำขอที่ถูกถอน (`withdrawn`) ต้องไม่ถูกเปลี่ยนสถานะตอนอนุมัติ
- error กลางทางใน transaction ต้อง rollback ครบทั้งสามขั้น
- เจ้าของอนุมัติคำขอเดิมซ้ำ → 409 (ไม่ใช่ pending แล้ว)

## Acceptance Criteria
- เจ้าของสัตว์เห็นคำขอทั้งหมดของสัตว์ตัวเอง; คนอื่น 403, ไม่พบสัตว์ 404, ไม่มี token 401
- อนุมัติแล้ว: คำขอเป็น `approved` + มี `decided_at`, คำขอ `pending` อื่นเป็น `rejected`, สัตว์เป็น `adopted`
- ปฏิเสธแล้วเฉพาะคำขอนั้นเป็น `rejected` และสัตว์ยังเป็น `available`
- ยิงอนุมัติพร้อมกันหลายคำขอ สำเร็จได้ 1 ที่เหลือ 409 และข้อมูลสุดท้ายสอดคล้องกัน
- เมื่อพังกลางทาง ข้อมูลทั้งหมดกลับเป็นเหมือนเดิม
- เทสต์รันกับ Postgres จริงที่แยกจาก dev ด้วยคำสั่ง npm เดียว
- ปฏิเสธ/อนุมัติคำขอซ้ำ (ที่ไม่ใช่ pending แล้ว) → 409

## Open Questions (ตอบแล้ว)
- `GET /applications/pet/:petId` ตอบ `{ data: [...] }` ไม่ต้อง pagination (สัตว์ 1 ตัวมีคำขอไม่มาก) แต่ละรายการ JOIN `users` เอา `display_name` ของผู้ยื่นมาด้วย
- ปฏิเสธคำขอแล้ว ไม่แตะสถานะสัตว์ (ยัง available) คนอื่นยื่นต่อได้
- อนุมัติ: คำขอ withdrawn ไม่ถูกแตะ (เปลี่ยนเฉพาะที่ pending)

## Testing Guidelines
List the test cases only.
- Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- Integration test ต่อ Postgres จริง (database แยกจาก dev) อยู่ใน `api/test/` ตาม convention ของ NestJS
- ดูคำขอของสัตว์: เจ้าของเห็นครบ, คนอื่น → 403, ไม่พบสัตว์ → 404, ไม่ login → 401
- อนุมัติ: คำขอ approved + `decided_at`, คำขอ pending อื่น rejected, สัตว์ adopted
- อนุมัติ/ปฏิเสธ: ไม่ใช่เจ้าของ → 403, ไม่พบ → 404, คำขอไม่ใช่ pending → 409, สัตว์ไม่ใช่ available → 409
- ปฏิเสธ: คำขอเป็น rejected และสัตว์ยัง available
- ยิงอนุมัติพร้อมกันหลายคำขอของสัตว์ตัวเดียว: สำเร็จ 1 ที่เหลือ 409
- Rollback: บังคับให้พังกลางทาง แล้วตรวจว่าทั้งสามขั้นไม่ถูกบันทึก
