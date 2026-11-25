# DESIGN.md — กติกาสไตล์ (สรุปจากหน้า landing ที่ใช้จริง)

ค่าทั้งหมดอยู่ใน `src/index.css` · โค้ดตัวอย่างอยู่ใน `src/features/landing/` · ไม่มี dark mode

## สี (ใช้ผ่าน utility ของ token เท่านั้น ห้าม hex ในคอมโพเนนต์)
| token | ค่า | ใช้กับ |
|---|---|---|
| `primary` / `ring` | `#1f6fb2` | สีเน้นสีเดียว: ปุ่มหลัก ลิงก์ เมนู active wordmark ไอคอน (ตัวขาวบนปุ่ม 5.28:1) |
| `background` | `#f5f8fb` | พื้นหน้า |
| `card` | `#ffffff` | การ์ด กรอบรูป ปุ่มรอง |
| `foreground` | `#1e2a36` | ตัวอักษรหลัก |
| `muted` / `muted-foreground` | `#ebf0f5` / `#566778` | กล่อง FAQ, skeleton / ข้อความรอง คำอธิบาย |
| `border` | `#dde5ed` | เส้นขอบการ์ด เส้นคั่น |
| `field-border` | `#8494a3` | ขอบช่องกรอก (ใช้ `/50` เป็นขอบปุ่มรองและขอบการ์ดตอน hover) |
| `status-*` | เขียว / เหลืองอุ่น / เทา | ป้ายสถานะเท่านั้น (รอบ้าน·อนุมัติ / มีบ้านแล้ว·รอพิจารณา / ปิด·ถอน) ห้ามใช้ตกแต่ง |

## ตัวอักษร
- หัวข้อ `h1` `h2`: **Anuphan** (`font-heading` ใส่ให้อัตโนมัติใน base layer) · เนื้อหา: **Noto Sans Thai**
- ขนาด: hero `h1` `text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.3]` · หัวข้อส่วน `h2` `text-3xl sm:text-4xl font-bold` (ปิดท้ายขยายถึง `lg:text-5xl`) · หัวข้อการ์ด `h3` `text-xl font-semibold` · คำถาม FAQ `text-lg font-semibold`
- เนื้อหา: คำอธิบาย hero `text-lg` · คำโปรยใต้หัวข้อและเนื้อการ์ด ขนาดปกติ `text-muted-foreground` · คำกำกับรูป `text-sm`
- ภาษาไทย: line-height หัวข้อไม่ต่ำกว่า 1.3 · ห้าม letter-spacing ติดลบ ห้าม `uppercase`/`tracking-*` · แบ่งวลีหัวข้อด้วย `<span className="inline-block">` (หรือ `block` เมื่อบังคับ 2 บรรทัด) เพื่อให้ตัดบรรทัดตรงรอยต่อวลี

## ระยะห่าง
- คอนเทนเนอร์: `max-w-6xl px-4 sm:px-6` (มาจาก `AppLayout`)
- จังหวะส่วน: **ส่วนโล่ง** (ประโยคกลางหน้า) `py-20 lg:py-32`, hero `py-14 sm:py-20 lg:py-28` · **ส่วนการ์ด** `py-16 lg:py-24`
- หัวข้อ → เนื้อหาในส่วน `mt-10 lg:mt-12` · หัวข้อ → คำโปรย `mt-3` · ข้อความ → ปุ่ม `mt-8`–`mt-10`
- กริดการ์ด `gap-4 md:gap-5` · กริดสัตว์ `gap-x-4 gap-y-10 md:gap-x-6` · padding การ์ด `p-6 lg:p-8`

## มุมโค้ง
`rounded-[1.5rem]` (24px) กรอบรูปใหญ่ · `rounded-[1.25rem]` (20px) การ์ดและกล่อง FAQ · `rounded-[1rem]` (16px) รูปในกรอบ · `--radius` 12px ช่องกรอกและรูปใน `PetCard` · `rounded-full` ปุ่มและชิป

## รูปแบบคอมโพเนนต์
- **การ์ด:** `rounded-[1.25rem] border bg-card p-6 lg:p-8` ไม่มีเงา · hover เปลี่ยนแค่ขอบ `hover:border-field-border/50`
- **กล่องพื้นเทา (FAQ):** `rounded-[1.25rem] bg-muted p-6 lg:p-8` ไม่มีขอบ
- **กรอบรูป:** `rounded-[1.5rem] border bg-card p-2 sm:p-3` รูปข้างในโค้ง 16px + คำกำกับชื่อ/จังหวัดจากข้อมูลจริง
- **ปุ่มหลัก:** `<Button className="rounded-full px-6">` (สูง 40px พื้น primary ทึบ hover เข้มขึ้น)
- **ปุ่มรอง:** `<Button variant="outline" className="rounded-full border-field-border/50 bg-card px-6">`
- **ลิงก์ข้อความ:** `font-semibold text-primary hover:underline underline-offset-[6px]`
- **ชิป:** `rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary` · ชิปสถานะใช้ `status-*`
- **ไอคอน:** lucide เส้นบาง `strokeWidth={1.5}` สี primary วางตรง ๆ ไม่มีกล่องรอบ

## เส้นขอบและการเคลื่อนไหว
- เส้นขอบ 1px (`border`) เป็นตัวแบ่งลำดับชั้นหลักร่วมกับระยะห่าง · ไม่ใช้เงา
- เลื่อนถึงแล้ว fade + ขึ้น 16px ครั้งเดียว (`Reveal`, 700ms) · รูป hover ซูม `1.03` · ทุกอนิเมชันอยู่หลัง `motion-safe:`

## ข้อห้าม
การ์ดซ้อนการ์ด · เงา (`shadow-*`) · gradient/blob · `border-l-4` · ไอคอน Sparkles · อีโมจิเป็นไอคอน · สีนอก token (รวมถึงสีเขียวเป็นของตกแต่ง) · ชิปพาสเทลหลายสี · parallax · สถิติ/รีวิว/ข้อความเร่งด่วนที่แต่งขึ้น · รูปสต็อกแทนข้อมูลจริง
