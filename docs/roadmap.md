# Roadmap
🤖 = AI เขียนได้ | ✍️ = เขียนเอง (AI ให้แค่ hint/รีวิว)

## สัปดาห์ 1 — Backend
- [x] 1. 🤖 Setup: docker-compose (Postgres), config, src/database, /health
- [ ] 2. 🤖 Migration 6 ตาราง (รีวิว constraint เอง)
- [ ] 3. ✍️ Error response กลาง (exception filter + รูปแบบ error เดียวทั้งระบบ)
- [ ] 4. ✍️ Auth: register, login, JWT guard
- [ ] 5. 🤖 Pets: สร้าง, รายการ + filter + pagination, รายละเอียด, ปิดโพสต์, บันทึก
- [ ] 6. ✍️ Applications: ยื่น (+แจ้งเตือนคนโพสต์), ถอน, business rules + unit test
- [ ] 7. ✍️ อนุมัติ/ปฏิเสธ แบบ transaction + แจ้งเตือน + เทสต์ยิงพร้อมกัน

## สัปดาห์ 2 — API ที่เหลือ, Frontend, AI, Ship
- [ ] 8. 🤖 Notifications API: รายการ, จำนวนยังไม่อ่าน, กดอ่าน
- [ ] 9. 🤖 Frontend: setup, login/register, หน้ารวมสัตว์, รายละเอียด
- [ ] 10. 🤖 Frontend: ฟอร์มยื่นคำขอ, คำขอของฉัน, สัตว์ของฉัน + รีวิวคำขอ, ที่บันทึกไว้, กระดิ่งแจ้งเตือน
- [ ] 11. 🤖 อัปโหลดรูป (storage ภายนอก)
- [ ] 12. 🤖 src/ai client + prompt / ✍️ worker (timeout, retry, fallback, ทำงานค้างต่อหลัง restart)
- [ ] 13. 🤖 CI (GitHub Actions รันเทสต์กับ Postgres) + deploy
- [ ] 14. ✍️ README + สรุปส่วนที่เขียนเอง/AI เขียน

## ถ้าเวลาไม่พอ ตัดตามลำดับนี้
11 (ใช้ URL รูปแทนการอัปโหลด) → บันทึกสัตว์ → กดอ่านแจ้งเตือนทีละอัน (เหลือแค่อ่านทั้งหมด)