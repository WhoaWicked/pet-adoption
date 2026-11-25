# Plan: final-consistency — ตรวจความสม่ำเสมอรอบสุดท้าย + เก็บงานเล็ก

branch: `claude/chore/ui-friendly` · ไม่ commit

## ผลตรวจ (ไล่ทุก route ใน `router.tsx` + grep ทั้ง `web/src`)
ผ่าน (ไม่ต้องแก้):
- ไม่มี hex/oklch/rgb นอก `index.css` · ไม่มีสีเขียวหลง (เหลือเฉพาะ token สถานะที่ตั้งใจ) · ไม่มี `border-l-4` / Sparkles / gradient
- ข้อความ notification ใช้ข้อความไทยจาก `notification-content.ts` (ไม่ใช้ message อังกฤษจาก API)
- footer ไม่ลอย: `AppLayout` เป็น `min-h-svh flex-col` + `main flex-1` อยู่แล้ว (ยืนยันจากภาพหน้า login / empty state รอบก่อน)
- toast (`ui/sonner.tsx`) ใช้ token `popover` / `border` / `--radius` อยู่แล้ว

ไม่ตรง DESIGN.md:
1. **404 (`NotFoundPage`)** — ปุ่มเดียวสี่เหลี่ยม (ไม่ใช่แคปซูล) ไม่มีทางไป `/pets`
2. **Header** — ลิงก์เมนู / wordmark ไม่มี focus ring (คีย์บอร์ดมองไม่เห็นว่าอยู่ตรงไหน) · ปุ่ม "ลงประกาศ" / "เข้าสู่ระบบ" / "สมัครสมาชิก" / "ออกจากระบบ" ยังเป็นสี่เหลี่ยม · เมนูมือถือ: ลิงก์ตัวเล็ก เป้ากดเตี้ย ปุ่มสี่เหลี่ยม
3. **ข้อความอังกฤษ** — ปุ่มปิด Sheet มี sr-only "Close" (`ui/sheet.tsx`)
4. **Dialog ยืนยัน (`ui/alert-dialog.tsx`)** — overlay ใช้ `bg-black` (สีนอก token) · กล่องใช้ `ring-1 ring-foreground/10` แทนเส้นขอบ token และโค้ง 12px · แถบปุ่มล่างเป็นพื้นเทาจาง · ปุ่มสี่เหลี่ยม · Sheet overlay ก็ `bg-black` เหมือนกัน
5. **Toast** — ไอคอน loading หมุนโดยไม่เคารพ reduced-motion
6. **Focus ring** — ลิงก์ธรรมดา (footer, ลิงก์ในข้อความ) ไม่มี focus ring · รายการแจ้งเตือนใช้ `focus-visible:outline-none` + แค่เปลี่ยนพื้น (เห็นยาก)
7. **Pagination** — ปุ่มสี่เหลี่ยม
8. **เงาบน popover / select / sheet** (`shadow-md`, `shadow-lg`) — ขัดกับ "ไม่ใช้เงา" ตามตัวอักษร

## จะแก้
1. 404: ข้อความไทยเป็นมิตร + ปุ่มแคปซูล "กลับหน้าแรก" (หลัก) และ "ดูน้อง ๆ ทั้งหมด" (รอง)
2. Header: focus ring ให้ลิงก์เมนู + wordmark · ปุ่มทั้งหมดเป็นแคปซูล · เมนูมือถือ: ลิงก์ `text-base` เป้ากดสูง ≥44px, ปุ่มแคปซูลเต็มความกว้าง
3. Sheet: sr-only "ปิดเมนู" แทน "Close"
4. alert-dialog: overlay `bg-foreground/20` (token) · กล่อง `rounded-[1.25rem] border` ไม่มี ring · แถบปุ่มไม่มีพื้นเทา · ปุ่ม Action/Cancel แคปซูล (ผ่าน `ConfirmDialog`) · Sheet overlay `bg-foreground/20`
5. Toast: ไอคอน loading `motion-safe:animate-spin`
6. Focus: กฎ base ใน `index.css` ให้ทุก `<a>` ที่โฟกัสด้วยคีย์บอร์ดมี outline สีหลัก 2px (ลิงก์ที่มี ring ของตัวเองใช้ `outline-none` อยู่แล้วจึงไม่ซ้อน) · รายการแจ้งเตือนใช้ ring มาตรฐาน
7. Pagination: ปุ่มแคปซูลรอง

## ไม่แก้ (พร้อมเหตุผล)
- ข้อ 8 เงาบน popover / select / sheet: เป็นชั้นลอยเหนือเนื้อหา เงาช่วยแยกชั้นให้เห็นว่าลอยอยู่ (DESIGN.md ห้ามเงาที่การ์ด/กล่องในหน้า) — ถ้าต้องการให้เอาออกทั้งหมด บอกได้
- `shadow-[…100vmax…]` ใน `PetFilters`: ไม่ใช่เงาที่มองเห็น เป็นเทคนิคยืดพื้นแถบ sticky เต็มจอ
- `rounded-4xl` ใน `ui/badge` / `rounded-md` ใน skeleton: map เป็น `--radius` 12px ตาม token อยู่แล้ว
