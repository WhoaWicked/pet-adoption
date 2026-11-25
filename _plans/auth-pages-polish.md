# Plan: auth-pages-polish — ปรับหน้า login / register ให้เข้ากับ DESIGN.md

branch: `claude/chore/ui-friendly` · อ้างอิง `web/DESIGN.md` · ผู้ใช้อนุมัติให้ implement ต่อจากแผนได้เลย · ไม่ commit

## ไฟล์ที่เกี่ยวข้อง (หาเจอ)
- `features/auth/AuthCard.tsx` — กรอบกลางจอ ใช้ร่วมกันแค่ 2 หน้า (login, register) → ปรับโครงที่นี่ที่เดียว
- `pages/LoginPage.tsx`, `pages/RegisterPage.tsx` — แก้เฉพาะข้อความหัว/คำอธิบาย และหน้าตาปุ่ม/Alert
- ใช้ของเดิม ไม่แก้: `FormField` (label เหนือช่อง + error ใต้ช่องอยู่แล้ว), `ui/input` (ring ตาม token อยู่แล้ว), `ui/button`, `ui/alert`
- register **ไม่มี select / การเลือกบทบาท** (มีแค่ ชื่อที่ใช้แสดง, อีเมล, รหัสผ่าน)

## คงไว้ทั้งหมด
ฟิลด์, validation, ข้อความ error จาก API (`getErrorMessage` / `getValidationErrors` รวม 401 รหัสผิด และ 409 อีเมลซ้ำ), การเก็บ token, redirect หลังสำเร็จ, `<Navigate>` กันคนที่ login แล้ว, ข้อความแจ้ง "สมัครสำเร็จ" / "เซสชันหมดอายุ" · ไม่เพิ่มฟีเจอร์ (ไม่มี Google / จำฉันไว้ / ลืมรหัสผ่าน)

## งาน
1. **`AuthCard`** — แทน shadcn `Card` (มี ring + ไอคอนอุ้งเท้าในวง) ด้วยกล่องตาม DESIGN.md
   - กว้าง `max-w-[26rem]` (416px) กลางหน้า · จอ `sm` ขึ้นไป: `rounded-[1.25rem] border bg-card p-8` ไม่มีเงา
   - มือถือ: ไม่มีกล่อง ฟอร์มวางบนพื้นหน้าเต็มความกว้าง (ระยะขอบข้างมาจาก `AppLayout`)
   - ส่วนหัว: wordmark "บ้านใหม่" (คลาสเดียวกับ Header) → `h1` → คำอธิบายบรรทัดเดียวสีเทา · ส่วนท้าย: ลิงก์สลับหน้า
2. **ข้อความหัว** — login: "ยินดีต้อนรับกลับมา" / "เข้าสู่ระบบเพื่อส่งคำขอและลงประกาศ" · register: "สร้างบัญชีใหม่" / "บัญชีเดียวใช้ได้ทั้งลงประกาศและขอรับเลี้ยง" (สั้นพอเป็นบรรทัดเดียวที่ 375px)
3. **ปุ่มหลัก** — แคปซูลเต็มความกว้าง · ระหว่างส่ง: ไอคอนหมุน (`motion-safe:animate-spin`) + ข้อความเดิม "กำลังเข้าสู่ระบบ…" / "กำลังสมัครสมาชิก…" · `disabled` + เช็ก `isPending` ใน onSubmit เหมือนเดิม
4. **Alert** — มุม 16px ให้เข้าชุด (ข้อความเดิม)
5. **ลิงก์สลับหน้า** — "ยังไม่มีบัญชี? สมัครสมาชิก" / "มีบัญชีแล้ว? เข้าสู่ระบบ" (เดิม) ปรับเป็น `font-semibold text-primary`

## ตรวจ
build + lint · ภาพ 375/1440: login ปกติ / login error จาก API (ดัก `/api/auth/login` ตอบ 401 "Invalid email or password") / login กำลังส่ง (ดักแล้วไม่ตอบ) / register ปกติ / register error ใต้ช่อง (กดส่งฟอร์มว่าง → validation เดิม) · จำลองใน headless browser เท่านั้น · หยุดรอให้ดู ไม่ commit
