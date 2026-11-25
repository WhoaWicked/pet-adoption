# Plan: motion-app-pages — อนิเมชันหน้าอื่นนอกจาก landing

branch: `claude/chore/ui-friendly` · ผู้ใช้อนุมัติให้ implement ต่อจากแผนได้เลย · ไม่มีไลบรารีใหม่ · ไม่ commit
**ตัดสินใจโดยเจ้าของโปรเจกต์:** ทำงานเสมอ ไม่ใส่ `motion-safe:` / เงื่อนไข prefers-reduced-motion

## หลัก
- transform / opacity เท่านั้น (ยกเว้นกาง/พับที่ผู้ใช้กดเอง ใช้ `grid-template-rows 0fr→1fr` ตาม brief)
- keyframes ใน `index.css`: `enter` (opacity 0 + translateY 16px → ปกติ, 400ms ease-out) · `fade-in` (400ms)
- **เล่นครั้งเดียวตอนเข้าหน้า:** hook `useEntrance(ready)` (`lib/use-entrance.ts`) คืน `true` ตั้งแต่ข้อมูลพร้อมครั้งแรกจนครบ 1.2 วิ แล้วเป็น `false` ถาวร → การ์ด/แถวที่ mount ใหม่ตอนกรอง/เปลี่ยนหน้า/refetch ไม่ได้คลาสอนิเมชัน (key ยังเป็น id เดิม ไม่ remount ทั้งกริด)
- stagger 50ms ต่อใบ สูงสุด 8 ใบแรก ใบที่ 9 ขึ้นไปใช้ดีเลย์เดียวกัน (ขึ้นพร้อมกัน)

## งาน
1. **PetCard** — hover: ยก 4px + รูปซูม 1.05 ใน overflow-hidden · 250ms ease-out
2. **`/pets`, ที่บันทึกไว้** — การ์ดเข้าแบบ stagger ตอนโหลดครั้งแรก (ห่อการ์ดด้วย div ที่มีคลาส `animate-enter` + `animationDelay`)
3. **รายละเอียดสัตว์** — รูปใหญ่ `animate-fade-in` · คอลัมน์ขวา `animate-enter` ดีเลย์ 120ms (เล่นตอน mount สถานะโหลดสำเร็จ ครั้งเดียว · refetch ไม่ remount)
4. **ปุ่ม (`ui/button.tsx`)** — transition สี/พื้น/เส้นขอบ/ring/transform 150ms · กด `active:scale-[0.97]` (แทน translate-y-px)
5. **SaveButton** — toggle (login อยู่) → หัวใจ pop 1 → 1.25 → 1 ใน 250ms (Web Animations API, เรียกก่อน onClick เดิม ไม่แตะ logic)
6. **กาง/พับ** — ตัวกรองมือถือ: grid 0fr→1fr + opacity 200ms, ตอนพับ `invisible` (ออกจาก tab order), md เปิดเสมอ · สรุป AI ที่แสดงผล: กางออกตอนปรากฏด้วย `@starting-style` (`starting:`)
7. **สัตว์ของฉัน, คำขอของฉัน, หน้าจัดการ (บล็อกคำขอ)** — แถว/บล็อกเข้าแบบ stagger ตอนโหลดครั้งแรก (เพิ่ม prop `enterDelay` ให้ `MyApplicationItem`, `PetApplicationCard` — UI เท่านั้น)
8. **Skeleton** — `animate-pulse` เดียวทั้งเว็บ (มีอยู่แล้ว) · alert-dialog / sheet overlay+กล่อง 200ms (คง animation ของ shadcn)

## ตรวจด้วยเบราว์เซอร์จริง (playwright-core + Chrome ในเครื่อง)
วัด transform/opacity ระหว่างเล่นเทียบหลังจบ ทุกข้อ · /pets: กรองแล้วการ์ดใหม่ไม่มีอนิเมชัน · refetch ไม่เล่นซ้ำ
