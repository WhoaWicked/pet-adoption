# Spec for project-setup

branch: claude/feature/project-setup-01
ownership: 🤖 AI may implement

## Summary
- วางรากฐานฝั่ง backend ของ pet adoption API (NestJS + TypeScript) เพื่อให้ฟีเจอร์ถัดไปมี database ที่ใช้งานได้ และมีวิธีตรวจว่า service ทำงานปกติ
- มี Postgres สำหรับ local development ที่เริ่มได้ด้วยคำสั่ง docker compose เพียงคำสั่งเดียว
- ดึง configuration ทั้งหมดจากไฟล์ `api/.env` พร้อมไฟล์ตัวอย่างที่ commit ไว้
- มี DatabaseModule ใน `api/src/database` ที่ provide connection pool กลางให้ส่วนอื่นของ API ใช้ผ่าน dependency injection
- มี endpoint `GET /health` ที่รายงานว่า API ทำงานอยู่ และเชื่อมต่อ database ได้หรือไม่

## Functional Requirements
- มีไฟล์ docker-compose ใน `api/` กำหนดเฉพาะ Postgres service (ไม่รวม API) พร้อม persistent volume โดยชื่อ database, user, password และ port มาจาก `api/.env`
- ใช้ Postgres image แบบ pin major version (17-alpine)
- Postgres service มี health check
- มีไฟล์ `api/.env.example` ระบุตัวแปรที่จำเป็นทั้งหมดพร้อมค่าตัวอย่างที่ปลอดภัย ส่วน `api/.env` ต้องถูก git ignore
- API อ่าน configuration ตอนเริ่มทำงาน และต้องหยุดทันทีพร้อมข้อความที่ชัดเจนหากตัวแปรที่จำเป็นหายไปหรือไม่ถูกต้อง
- DatabaseModule provide pool instance เดียวทั้งแอป และให้ class อื่นรับ pool ผ่าน constructor injection (ไม่ import pool ตรง ๆ)
- ปิด pool อย่างเรียบร้อย (graceful shutdown) เมื่อ API หยุดทำงาน
- `GET /health` ตอบ 200 พร้อม JSON ที่มีแค่สถานะรวมและสถานะ database (ไม่แสดง uptime หรือ version)
- เมื่อเชื่อมต่อ database ไม่ได้ `GET /health` ต้องตอบ 503 พร้อม JSON ที่ระบุว่า database ใช้งานไม่ได้ โดยไม่เปิดเผยรายละเอียดการเชื่อมต่อหรือ credentials
- การเช็ก database ใน `/health` ใช้ query ที่เบา และมี timeout สั้น

## Possible Edge Cases
- ไฟล์ `.env` หายไป หรือตัวแปรที่จำเป็นเป็นค่าว่าง
- Postgres container ยังไม่ทำงาน หรือยังเริ่มไม่เสร็จตอน API บูต
- Database ใช้งานไม่ได้หลังจาก API เริ่มทำงานแล้ว
- Port ของ Postgres หรือ API ถูกใช้งานอยู่แล้วบนเครื่อง
- Credentials ผิด หรือชื่อ database ไม่มีอยู่จริง
- Query ค้าง ทำให้ `/health` ต้องยังตอบกลับได้ภายในเวลาที่กำหนด
- Error จาก idle client ใน pool ต้องไม่ทำให้ process crash
- รหัสผ่าน database ที่มีอักขระพิเศษ

## Acceptance Criteria
- รัน docker compose up ใน `api/` แล้วได้ Postgres ที่ใช้ค่าจาก `api/.env` และข้อมูลยังอยู่หลัง restart
- เริ่ม API ด้วย `npm run start:dev` และ `.env` ที่ถูกต้องได้สำเร็จ และ pool เชื่อมต่อ database ได้
- เริ่ม API โดยขาดตัวแปรที่จำเป็นแล้วล้มเหลวพร้อมข้อความ error ที่ชัดเจน
- `GET /health` ตอบ 200 และรายงาน database ปกติ เมื่อ Postgres ทำงานอยู่
- `GET /health` ตอบ 503 และรายงาน database ไม่ปกติ เมื่อ Postgres หยุดอยู่ โดย response ไม่มีข้อมูลลับ
- `api/.env` ถูก git ignore และ `api/.env.example` ถูก commit
- Pool ถูก provide ผ่าน DatabaseModule และ inject เข้า class อื่นผ่าน constructor ได้ โดยมี pool instance เดียวทั้งแอป

## Open Questions (ตอบแล้ว)
- Framework: NestJS + TypeScript
- Postgres เวอร์ชัน: 17-alpine (ตอนสร้าง Neon ให้เลือก 17 ให้ตรงกัน)
- docker-compose รวม API ไหม: ไม่รวม มีเฉพาะ Postgres ส่วน API รันด้วย npm run start:dev เพื่อให้ได้ hot reload
- /health แสดงข้อมูลเพิ่มไหม: ไม่ มีแค่สถานะรวมกับสถานะ database
- Database แยกสำหรับเทสต์: ยังไม่ทำในขั้นนี้ จะเพิ่มในขั้นที่ 6 ตอนเริ่มเขียน integration test กับ database จริง

## Testing Guidelines
List the test cases only.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- การโหลด config คืนค่าที่คาดไว้เมื่อมีตัวแปรที่จำเป็นครบ
- การโหลด config โยน error ที่ชัดเจนเมื่อขาดตัวแปรที่จำเป็น
- `GET /health` ตอบ 200 และรายงาน database ปกติ เมื่อ query สำเร็จ
- `GET /health` ตอบ 503 และรายงาน database ไม่ปกติ เมื่อ query ล้มเหลวหรือ timeout โดย body ไม่มี credentials