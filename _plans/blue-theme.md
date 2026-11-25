# Plan: blue-theme — เปลี่ยนโทนสีจากเขียวเป็นฟ้า

branch: `claude/chore/ui-friendly` · แก้ที่ design token ใน `web/src/index.css` เป็นหลัก · ไม่แก้ layout ข้อความ logic หรือฟอนต์ · ไม่ commit

## สิ่งที่ตรวจเจอ
- **สีทั้งหมดมาจาก token อยู่แล้ว:** grep ทั้ง `web/src` หา `#2f6b55`, hex อื่น ๆ, `green-*`, `emerald-*`, `teal-*`, `lime-*`, `rgb(`, `oklch(` นอก `index.css` → ไม่เจอสีฮาร์ดโค้ดเลย (มีแค่ `color-mix` ใน hover ของปุ่ม secondary ซึ่งผสมจาก token)
- wordmark ใน Header, ลิงก์, เมนู active, ring ใช้ `text-primary` / `border-primary` / `ring` → เปลี่ยนตามเองเมื่อแก้ token
- **ใช้เขียวผิดความหมาย 1 จุด:** ชิป "ขั้นที่ n" ใน `features/landing/HowItWorks.tsx` ใช้ `bg-status-available` (สีเขียวของสถานะ) เป็นของตกแต่ง → เปลี่ยนเป็นโทนสีหลัก
- **meta theme-color:** ไม่มีใน `index.html` (จึงไม่ต้องแก้ และไม่เพิ่มใหม่)
- **favicon:** `public/favicon.svg` เป็นโลโก้ Vite สีม่วงตั้งต้น ไม่ใช่สีเขียว → ไม่แตะในรอบนี้
- คอมเมนต์ที่พูดถึง "เขียว" ใน `index.css` จะแก้ให้ตรงกับสีใหม่

## ผลตรวจ contrast (WCAG 2.x)
| คู่สี | ค่า | ผล |
|---|---|---|
| ตัวขาวบนปุ่มหลัก `#1F6FB2` | 5.28:1 | ผ่าน AA |
| ลิงก์ `#1F6FB2` บนพื้น `#F5F8FB` | 4.96:1 | ผ่าน |
| ลิงก์บน card ขาว | 5.28:1 | ผ่าน |
| ลิงก์บน muted `#EBF0F5` | 4.61:1 | ผ่าน (เฉียด) |
| ข้อความรอง `#566778` บนพื้น / muted / card | 5.46 / 5.08 / 5.82 | ผ่าน |
| ตัวอักษรหลัก `#1E2A36` บนพื้น | 13.7:1 | ผ่าน |
| **ตัวขาวบนปุ่มหลักตอน hover** (`hover:bg-primary/80` ใน `button.tsx` ทำให้สีอ่อนลง) | **3.69:1** | **ไม่ผ่าน** |

**สรุป:** `#1F6FB2` ใช้ได้ตามที่ขอ ไม่ต้องเข้มขึ้น · ที่ไม่ผ่านคือ hover ของปุ่มหลักซึ่งทำให้ปุ่ม "อ่อนลง"
(ต่อให้เข้มเป็น `#1A5F9A` hover ก็ยังได้แค่ 4.33:1) → แก้ที่ต้นเหตุ: ให้ hover **เข้มขึ้น** แทน

## งานที่จะทำ

### 1. token ใน `index.css` (`:root`)
| token | เดิม | ใหม่ | หมายเหตุ |
|---|---|---|---|
| `--background` | `#fcf8f5` | `#f5f8fb` | ตามที่ขอ |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground` | `#2b2522` | `#1e2a36` | ถ่านอมฟ้า เข้ากับพื้นเย็น |
| `--card`, `--popover` | `#ffffff` | `#ffffff` | คงเดิม |
| `--primary`, `--ring` | `#2f6b55` | `#1f6fb2` | ตามที่ขอ |
| `--secondary`, `--muted` | `#f3ece6` | `#ebf0f5` | เทาอมฟ้าอ่อน |
| `--secondary-foreground` | `#3a322e` | `#2a3846` | |
| `--muted-foreground` | `#6b615a` | `#566778` | ข้อความรอง |
| `--accent` | `#efe7e0` | `#e6edf4` | พื้น hover |
| `--border` | `#eae1d9` | `#dde5ed` | เส้นคั่นอ่อน |
| `--input` | `#e3d9d0` | `#d3dde7` | |
| `--field-border` | `#9a9089` | `#8494a3` | ขอบช่องกรอกบนขาว 3.1:1 (เกณฑ์ 3:1 ของขอบ UI) |
| `--hero` | `#f5ece4` | `#e8eff6` | ตอนนี้ไม่มีหน้าไหนใช้แล้ว แต่ปรับให้เข้าชุด |
| `--status-closed` / `-foreground` | `#efe9e4` / `#5c534d` | `#eaeef2` / `#4f5d6b` | เทาโทนเย็น (5.8:1) |
| `--destructive` | `#b3261e` | คงเดิม | 6.1:1 บนพื้นใหม่ |

**คงไว้ (สีสถานะที่มีความหมาย):**
- `--status-available` / `-foreground` (`#e3efe9` / `#24523f`, 7.6:1) **คงเป็นเขียว** → ใช้ที่ป้าย "รอบ้าน" (`PetStatusBadge`) และ "อนุมัติแล้ว" (`ApplicationStatusBadge`)
- `--status-adopted` / `-foreground` (เหลืองอุ่น) คงเดิม → ป้าย "มีบ้านแล้ว" และ "รอพิจารณา"

### 2. hover ของปุ่มหลัก — `components/ui/button.tsx` (1 บรรทัด)
- `hover:bg-primary/80` → `hover:bg-[color-mix(in_oklch,var(--primary),black_12%)]` (ใช้วิธีเดียวกับ hover ของปุ่ม secondary ในไฟล์เดียวกัน ไม่เพิ่ม token)
- ผล: ตอน hover ปุ่มเข้มขึ้นเล็กน้อย ตัวขาวได้มากกว่า 5.28:1
- เป็นไฟล์ shadcn ใน `web/` (เขียนได้ตาม CLAUDE.md) · ไม่เปลี่ยน layout

### 3. ชิปขั้นตอน — `features/landing/HowItWorks.tsx`
- `bg-status-available text-status-available-foreground` → `bg-primary/10 text-primary` (ฟ้าอ่อน ตัวฟ้า 4.63:1) เพราะไม่ใช่สถานะ

### 4. คอมเมนต์
- แก้คอมเมนต์ใน `index.css` ที่บอก "เขียวใบไม้เข้ม" และค่า contrast ให้ตรงกับค่าใหม่

## ตรวจหลังทำเสร็จ
1. grep หา `2f6b55`, `green`, `emerald`, `status-available` ทั้ง `web/` → เหลือเฉพาะ token สถานะและ 2 badge ที่ตั้งใจ
2. `npm run build` + `npm run lint`
3. ถ่ายภาพ landing, `/pets`, `/login` ที่ 375px และ 1440px แล้วหยุดรอ · ไม่ commit
