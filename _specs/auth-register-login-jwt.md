# Spec for auth-register-login-jwt

branch: claude/feature/auth-register-login-jwt
ownership: ✍️ developer implements (AI gives hints/review only)
ยกเว้น: ติดตั้ง package และเพิ่ม JWT_SECRET ใน .env.example กับ env.ts เป็นงาน config (🤖)

## Summary
- ระบบสมัครสมาชิกด้วย email + password และเข้าสู่ระบบเพื่อรับ JWT
- มี JWT guard สำหรับป้องกัน route และดึง user id ของผู้ใช้ที่ login อยู่ไปใช้ต่อได้
- ผู้ใช้มีแบบเดียว ไม่มี role ไม่มี refresh token ไม่มี Google login

## Functional Requirements
- Register: รับ email + password, hash password ด้วย bcrypt ก่อนบันทึก, ไม่ส่ง password/hash กลับใน response
- Login: ตรวจ email + password แล้วคืน JWT
- JWT guard: ตรวจ token ใน header `Authorization: Bearer <token>` และให้ handler เข้าถึง user id ได้
- ใช้ตาราง `users` ที่มีอยู่ ห้ามเพิ่มคอลัมน์
- email ซ้ำตอน register ตอบ 409 ผ่าน exception filter กลางที่มีแล้ว
- login ผิดตอบข้อความเดียวกัน ไม่ว่าจะไม่มีอีเมลหรือรหัสผ่านผิด (401)
- เพิ่ม `JWT_SECRET` ใน `.env` และ `.env.example` และตรวจค่าใน `api/src/config/env.ts`
- โค้ดอยู่ใน `api/src/auth/` แยก controller → service → repository และโปรเจกต์เป็น CJS

## Possible Edge Cases
- email/password ว่างหรือรูปแบบไม่ถูกต้อง (ตอบ 400 ผ่าน validation เดิม)
- ไม่ส่ง token, token หมดอายุ หรือ token ไม่ถูกต้อง → 401

## Acceptance Criteria
- สมัครด้วย email ใหม่สำเร็จ และ password ใน DB เป็น bcrypt hash
- สมัครด้วย email ซ้ำได้ 409 ในรูปแบบ error กลาง
- login ถูกต้องได้ JWT; login ผิดทั้งสองกรณีได้ข้อความเหมือนกัน
- route ที่ใช้ guard เข้าไม่ได้ถ้าไม่มี/ใช้ token ผิด และเข้าได้พร้อมได้ user id ถ้า token ถูก
- app ไม่ start ถ้าไม่มี `JWT_SECRET`
- เปลี่ยนค่า JWT_SECRET แล้ว token เก่าใช้ไม่ได้

## Open Questions
- อายุของ JWT (expiresIn) ควรเป็นเท่าไร ตอบ 1hr
- กติกาความยาวขั้นต่ำของ password ตอบ ขั้นต่ำ 8

## Testing Guidelines
List the test cases only.
- Do NOT write test code for api/src/auth/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- register สำเร็จ: hash password ก่อนบันทึก และไม่คืน password
- register email ซ้ำ → 409
- login สำเร็จ → ได้ JWT
- login ไม่มีอีเมล และ login รหัสผ่านผิด → ข้อความเดียวกัน
- guard: ไม่มี token / token ผิด / token หมดอายุ → 401
- guard: token ถูก → ดึง user id ได้
- env: ไม่มี `JWT_SECRET` → validation ล้มเหลว
