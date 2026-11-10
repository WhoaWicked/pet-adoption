# Spec for pets-ownership

branch: claude/feature/pets-ownership
ownership: ✍️ developer implements (AI gives hints/review only) — ยกเว้นงาน config (🤖): AuthModule export JwtAuthGuard และ JwtModule

## Summary
- ฟีเจอร์จัดการสัตว์ใน `api/src/pets/`: สร้างโพสต์, ดูรายการ/รายละเอียด, ปิดโพสต์, บันทึกสัตว์
- ผู้พัฒนาเขียน logic เอง AI ทำเฉพาะงาน config ให้ `AuthModule` export `JwtAuthGuard` กับ `JwtModule` เพื่อให้ `PetsModule` ใช้ guard ได้

## Functional Requirements
- สร้างสัตว์: ต้อง login (`JwtAuthGuard`), `owner_id` มาจาก `request.user.id` ไม่รับจาก body, `image_url` เป็น string optional
- รายการสัตว์: filter `species` / `province`, pagination `limit` / `offset`, แสดงเฉพาะ status `available`
- รายละเอียดสัตว์ 1 ตัว: ไม่ต้อง login
- ปิดโพสต์: เปลี่ยน status เป็น `closed` เฉพาะเจ้าของ — คนอื่นตอบ 403, ไม่พบสัตว์ตอบ 404
- บันทึก / เลิกบันทึกสัตว์ และดูรายการที่บันทึกไว้ (`saved_pets`): ต้อง login
- ใช้ตาราง `pets` และ `saved_pets` ที่มีอยู่ ห้ามเพิ่มคอลัมน์ ห้ามลบโพสต์ (มีแค่ปิด)
- โครงสร้าง controller → service → repository, raw SQL ผ่าน `PG_POOL`, DTO ใช้ class-validator
- ใช้ error filter กลางที่มีอยู่ ไม่ทำ error handling เอง
- โปรเจกต์เป็น CJS
- บันทึกสัตว์: ใช้ `PUT /pets/:id/save` และเลิกบันทึก: `DELETE /pets/:id/save` ทั้งคู่ idempotent (บันทึกซ้ำ/เลิกบันทึกที่ไม่ได้บันทึก ถือว่าสำเร็จ ไม่ตอบ error)
- บันทึกสัตว์ที่ไม่มีอยู่จริงตอบ 404 (service เช็กก่อน ไม่ปล่อยให้ foreign key ชนแล้วได้ 409)

## Possible Edge Cases
- `limit` / `offset` ไม่ใช่ตัวเลขหรือติดลบ (ให้ DTO validate)
- บันทึกสัตว์ตัวเดิมซ้ำ / เลิกบันทึกสัตว์ที่ไม่ได้บันทึก

## Acceptance Criteria
- ผู้ใช้ที่ login สร้างสัตว์ได้ และ `owner_id` ตรงกับผู้ใช้ใน token
- รายการแสดงเฉพาะ `available` และ filter/pagination ทำงานถูกต้อง
- ปิดโพสต์ได้เฉพาะเจ้าของ (403 / 404 ตามเงื่อนไข)
- endpoint ที่ต้อง login ถูกปฏิเสธเมื่อไม่มี token
- `PetsModule` ใช้ `JwtAuthGuard` ได้หลัง `AuthModule` export

## Open Questions
- การบันทึกซ้ำควรตอบ error หรือถือว่าสำเร็จ (idempotent)? ถือว่าสำเร็จ (idempotent) ไม่ตอบ error
- รายการที่บันทึกไว้ควรแสดงสัตว์ที่ปิด/adopted แล้วด้วยหรือไม่? แสดงสัตว์ทุกสถานะ แต่ส่ง status กลับไปด้วย ให้ frontend โชว์ป้าย "ปิดรับแล้ว"

## Testing Guidelines
List the test cases only.
- - Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- สร้างสัตว์: `owner_id` ใช้ค่าจาก `request.user.id` ไม่ใช่จาก body
- รายการ: คืนเฉพาะ `available` และ filter `species` / `province` ถูกต้อง
- รายการ: pagination `limit` / `offset` ทำงานถูกต้อง
- ปิดโพสต์: เจ้าของปิดได้ → status เป็น `closed`
- ปิดโพสต์: ไม่ใช่เจ้าของ → 403, ไม่พบสัตว์ → 404
- บันทึก / เลิกบันทึก / ดูรายการที่บันทึกไว้ของผู้ใช้ที่ login
