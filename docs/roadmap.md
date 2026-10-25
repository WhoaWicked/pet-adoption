# Roadmap
🤖 = AI เขียนได้ | ✍️ = เขียนเอง (AI ให้แค่ hint/รีวิว)

## สัปดาห์ 1 — Backend
- [ ] 1. 🤖 Setup: docker-compose (Postgres), config, src/database, /health
- [ ] 2. 🤖 Migration 6 ตาราง + seed admin (รีวิว constraint เอง)
- [ ] 3. ✍️ Error response กลาง (exception filter + รูปแบบ error เดียวทั้งระบบ)
- [ ] 4. ✍️ Auth: register, login, JWT guard, role guard
- [ ] 5. 🤖 Pets: สร้าง, รายการ + filter + pagination, รายละเอียด, ปิดโพสต์, บันทึก
- [ ] 6. ✍️ Applications: ยื่น, ถอน, business rules + unit test
- [ ] 7. ✍️ อนุมัติ/ปฏิเสธ แบบ transaction + activity log + เทสต์ยิงพร้อมกัน

## สัปดาห์ 2 — Frontend, AI, Ship
- [ ] 8. 🤖 Frontend: setup, login/register, หน้ารวมสัตว์, รายละเอียด
- [ ] 9. 🤖 Frontend: ฟอร์มยื่นคำขอ, คำขอของฉัน, สัตว์ของฉัน + รีวิวคำขอ, ที่บันทึกไว้
- [ ] 10. 🤖 อัปโหลดรูป (storage ภายนอก)
- [ ] 11. 🤖 src/ai client + prompt / ✍️ worker (timeout, retry, fallback, ทำงานค้างต่อหลัง restart)
- [ ] 12. 🤖 หน้า admin ดู activity log
- [ ] 13. 🤖 CI (GitHub Actions รันเทสต์กับ Postgres) + deploy
- [ ] 14. ✍️ README + สรุปส่วนที่เขียนเอง/AI เขียน

## ถ้าเวลาไม่พอ ตัดตามลำดับนี้
12 (admin) → 10 (ใช้ URL รูปแทนการอัปโหลด) → บันทึกสัตว์