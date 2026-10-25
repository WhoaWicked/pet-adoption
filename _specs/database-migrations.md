# Spec for database-migrations

branch: claude/feature/database-migrations
ownership: 🤖 AI may implement

## Summary
- สร้างระบบ migration ด้วย node-pg-migrate แบบไฟล์ .sql
- migration แรกสร้าง schema ให้ตรงกับ docs/schema.sql ทุกประการ (6 ตาราง: users, pets,
  adoption_applications, ai_summaries, saved_pets, notifications พร้อมทุก constraint และ index)
- มีทั้งขา up และ down และมี npm script สำหรับ migrate up/down
- ผู้พัฒนารีวิว constraint เองหลัง AI เขียนเสร็จ

## Functional Requirements
- ใช้ node-pg-migrate และเขียน migration เป็นไฟล์ .sql เท่านั้น เก็บใน api/migrations/
- ตั้งชื่อไฟล์ด้วย timestamp ตามค่าเริ่มต้นของเครื่องมือ
- ขา up ของ migration แรกต้องเหมือน docs/schema.sql ทุกบรรทัด ห้ามเพิ่มหรือลด constraint, index
  หรือคอลัมน์ใด ๆ ที่ไม่อยู่ในไฟล์นั้น
- ขา down ลบทุกอย่างที่ขา up สร้าง โดยเรียงลำดับตาม foreign key
- npm script ใน api/package.json: migrate up (ทุกไฟล์ที่ยังไม่ได้รัน) และ migrate down (ย้อนครั้งล่าสุด)
- migrate ใช้ค่าเชื่อมต่อจาก api/.env ชุดเดียวกับ API (DB_HOST, DB_PORT, DB_NAME, DB_USER,
  DB_PASSWORD) ไม่สร้างตัวแปรชุดใหม่ และต้องรองรับรหัสผ่านที่มีอักขระพิเศษในเครื่องหมายคำพูดเดี่ยว
- แต่ละ migration รันใน transaction ถ้าล้มกลางคันต้องไม่เหลือ schema ค้างครึ่ง ๆ
- ใส่หมายเหตุบนหัว docs/schema.sql ว่าเป็นการออกแบบตั้งต้น schema ปัจจุบันให้ดูจาก api/migrations/
- อัปเดต api/README.md วิธีรัน migrate up/down

## Possible Edge Cases
- รัน migrate up ซ้ำเมื่อรันไปแล้ว ต้องไม่ทำอะไรและไม่ error
- รัน migrate down เมื่อยังไม่มี migration ถูกรัน
- Postgres ไม่ทำงานหรือ credentials ผิด ต้อง error ที่เข้าใจได้และไม่พิมพ์รหัสผ่าน
- api/.env หายหรือตัวแปรว่าง
- รหัสผ่านมีอักขระพิเศษ (#, $, @, :, /)
- มีตารางอยู่แล้วจากการสร้างด้วยมือ ทำให้ migration ชน

## Acceptance Criteria
- migrate up บน database ว่างได้ครบ 6 ตาราง และขา up ตรงกับ docs/schema.sql (เทียบด้วย diff)
- migrate up ซ้ำไม่มีผลและไม่ error
- migrate down แล้วเหลือแค่ตารางที่ node-pg-migrate ใช้ติดตามประวัติ
- migrate up → down → up ผ่านทุกขั้น
- ตรวจด้วยมือว่า constraint ทำงาน: species/status ค่าผิด, age_months ติดลบ, อีเมลซ้ำ,
  (pet_id, applicant_id) ซ้ำ ต้องถูกปฏิเสธ
- ลบ user หรือ pet ที่มีคำขออ้างอิงอยู่ต้องถูกปฏิเสธ (RESTRICT)
- ลบ application ลบ ai_summaries ตาม, ลบ user ลบ saved_pets และ notifications ของเขาตาม,
  ลบ pet ลบ saved_pets ตาม (notifications ไม่มี FK ไปที่ pets จึงไม่ถูกลบตาม)

## Open Questions (ตอบแล้ว)
- ชื่อไฟล์: timestamp ตามค่าเริ่มต้น
- ที่เก็บ: api/migrations/ และเก็บ docs/schema.sql ไว้เป็นเอกสารการออกแบบตั้งต้น
- อ่านค่า DB_*: ให้ plan เลือกวิธี ขอแค่ใช้ .env ชุดเดียวกับ API
- ความเข้ากันได้: โปรเจกต์เป็น CJS (ไม่มี "type": "module") แต่ Jest รันด้วย
  --experimental-vm-modules ให้ plan เช็กว่า node-pg-migrate ไม่ชนกับ setup นี้
- notifications.type: คงเป็น TEXT ไม่มี CHECK ไปกำหนดตอนทำฟีเจอร์แจ้งเตือน
- รัน migrate อัตโนมัติ: ไม่ รันด้วยคำสั่งเอง ตัดสินอีกครั้งตอนขั้นที่ 13
- Database สำหรับเทสต์: ยังไม่มี จะเพิ่มในขั้นที่ 6

## Testing Guidelines
ไม่มี automated test ในขั้นนี้ เพราะยังไม่มี database สำหรับเทสต์ (จะเพิ่มในขั้นที่ 6)
และเทสต์ที่รัน migrate down จะล้างข้อมูลใน database dev
ให้ตรวจด้วยมือตาม Acceptance Criteria แทน