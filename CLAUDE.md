# Pet Adoption Platform

เว็บให้คนทั่วไปโพสต์หาบ้านให้สัตว์ และยื่นขอรับเลี้ยงสัตว์ได้
ทุกคนเป็นได้ทั้งคนโพสต์และคนขอรับเลี้ยง มี admin ไว้ดู activity log
มี AI สรุปคำขอรับเลี้ยงให้คนโพสต์อ่าน (AI ไม่ได้ตัดสินแทน)

## Stack
- api/: NestJS (TypeScript), PostgreSQL ผ่าน pg (raw SQL, ไม่ใช้ ORM), Jest + supertest
- web/: React + Vite + TypeScript
- Deploy: web → Vercel, api → Render, database → Neon

## โครงสร้าง api/src (แต่ละ module แยก controller → service → repository)
- auth/          — register, login, JWT guard, role guard
- pets/          — โพสต์สัตว์, รายการ, filter, ปิดโพสต์, บันทึกสัตว์
- applications/  — ยื่น/ถอน/อนุมัติ/ปฏิเสธคำขอ
- worker/        — งานเบื้องหลัง (AI summary)
- ai/            — client สำหรับเรียก LLM
- admin/         — ดู activity log (เฉพาะ admin)
- database/      — connection pool และ helper ของ pg

ไฟล์เทสต์อยู่ข้างไฟล์ที่ทดสอบ (xxx.spec.ts) ห้ามสร้างโฟลเดอร์ tests/

## ตาราง
users, pets, adoption_applications, ai_summaries, saved_pets, activity_logs

## State
- สัตว์: available → adopted | closed
- คำขอ: pending → approved | rejected | withdrawn

## Business rules
- ขอรับเลี้ยงสัตว์ตัวเดียวกันซ้ำไม่ได้
- ขอรับเลี้ยงสัตว์ที่ตัวเองโพสต์ไม่ได้
- ขอรับเลี้ยงสัตว์ที่ไม่ใช่ available ไม่ได้
- อนุมัติได้เฉพาะเจ้าของโพสต์
- อนุมัติ 1 คำขอ → คำขออื่นของสัตว์ตัวนั้นเป็น rejected ทั้งหมด
  และสัตว์เป็น adopted ทั้งหมดนี้ต้องสำเร็จพร้อมกันหรือล้มพร้อมกัน
- กดอนุมัติพร้อมกันหลายคำขอ ต้องสำเร็จได้แค่ 1
- ไม่มีการลบโพสต์ มีแค่ปิดโพสต์ (status = closed)
- ทุกการเปลี่ยนสถานะสำคัญต้องบันทึก activity_logs
  ใน transaction เดียวกับการเปลี่ยนสถานะ
- งาน AI summary ต้องไม่หายถ้าเซิร์ฟเวอร์ restart

## นอกขอบเขต
แชท, real-time, แผนที่, อีเมล

## กติกาการช่วยเขียนโค้ด (สำคัญที่สุด)
นี่คือโปรเจกต์ portfolio ที่ผมต้องอธิบายได้ในสัมภาษณ์
- เขียนได้: setup, config, migration, api/src/pets/, api/src/database/,
  api/src/ai/, api/src/admin/, web/ ทั้งหมด, CI, deploy config,
  และไฟล์โครงเปล่าที่ได้จาก nest g
- ห้ามเขียนหรือแก้ logic ใน: api/src/auth/, api/src/applications/*.service.ts,
  api/src/worker/ และไฟล์ *.spec.ts ของส่วนเหล่านี้
- ถ้าถูกขอให้ช่วยในส่วนต้องห้าม: ตอบเป็น hint หรือคำถามนำเท่านั้น
  ห้ามให้โค้ดที่เอาไปวางได้ทันที
- ถ้า plan ไหนต้องแตะส่วนต้องห้าม ให้หยุดและบอกผมก่อน
- ทุกครั้งที่เขียนโค้ดให้ อธิบายสั้น ๆ ว่าแต่ละส่วนทำอะไร
- ถ้าถูกขอให้รีวิว: รีวิวอย่างเดียว ห้ามแก้ไฟล์

## เอกสาร
- docs/roadmap.md — ลำดับฟีเจอร์และสถานะ
- _specs/ — spec รายฟีเจอร์
- _plans/ — plan รายฟีเจอร์