# Roadmap
🤖 = AI เขียนได้ | ✍️ = เขียนเอง (AI ให้แค่ hint/รีวิว)

## สัปดาห์ 1 — Backend
- [x] 1. 🤖 Setup: docker-compose (Postgres), config, src/database, /health
- [x] 2. 🤖 Migration 6 ตาราง (รีวิว constraint เอง)
- [x] 3. ✍️ Error response กลาง (exception filter + รูปแบบ error เดียวทั้งระบบ)
- [x] 4. ✍️ Auth: register, login, JWT guard
- [x] 5. 🤖 Pets: สร้าง, รายการ + filter + pagination, รายละเอียด, ปิดโพสต์, บันทึก
- [x] 6. ✍️ Applications: ยื่น (+แจ้งเตือนคนโพสต์), ถอน, business rules + unit test
- [x] 7. ✍️ อนุมัติ/ปฏิเสธ แบบ transaction + แจ้งเตือน + เทสต์ยิงพร้อมกัน
- [ ] 12. AI สรุปคำขอ (แบบเรียกตามกดปุ่ม ไม่มี worker)
  - 🤖 BE: โมดูล `api/src/ai/` (AI client ของ Gemini, prompt, validator, repository ของ ai_summaries)
  - ✍️ BE: endpoint `POST /applications/:id/summary` (เฉพาะเจ้าของสัตว์), timeout, retry เบาๆ, fallback (มีสรุปเก่าก็คืนอันเก่า), รีเซ็ตสรุปเมื่อยื่นใหม่หลังถอน + unit test
  - 🤖 FE: ปุ่ม "สรุปด้วย AI" ในการ์ดคำขอ, ปุ่ม "สรุปทั้งหมด" (เรียกทีละใบ), สถานะโหลด/ล้มเหลว
  - เก็บผลใน `ai_summaries` ที่มีอยู่แล้ว ไม่เพิ่มคอลัมน์

## สัปดาห์ 2 — API ที่เหลือ, Frontend, AI, Ship
- [x] 8. 🤖 Notifications API: รายการ, จำนวนยังไม่อ่าน, กดอ่าน
- [x] 9. 🤖 Frontend: setup, login/register, หน้ารวมสัตว์, รายละเอียด
- [x] 10. 🤖 Frontend: ฟอร์มยื่นคำขอ, คำขอของฉัน, สัตว์ของฉัน + รีวิวคำขอ, ที่บันทึกไว้, กระดิ่งแจ้งเตือน
- [ ] 11. 🤖 อัปโหลดรูป (storage ภายนอก)
- [ ] 12. 🤖 src/ai client + prompt / ✍️ worker (timeout, retry, fallback, ทำงานค้างต่อหลัง restart)
- [ ] 13. 🤖 CI (GitHub Actions รันเทสต์กับ Postgres) + deploy
- [ ] 14. ✍️ README + สรุปส่วนที่เขียนเอง/AI เขียน

## ถ้าเวลาไม่พอ ตัดตามลำดับนี้
11 (ใช้ URL รูปแทนการอัปโหลด) → บันทึกสัตว์ → กดอ่านแจ้งเตือนทีละอัน (เหลือแค่อ่านทั้งหมด)