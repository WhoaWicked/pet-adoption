# Plan: landing-page — หน้า landing ที่ "/" และย้ายหน้ารายการสัตว์ไป "/pets"

branch: `claude/chore/ui-friendly` (ต่อจากรอบปรับ UI) · ใช้ skill `frontend-design:frontend-design` ตรวจ

## Context
ตอนนี้ "/" คือหน้ารายการสัตว์ (`PetsListPage`) ซึ่งมีแถบต้อนรับ (hero) อยู่บนสุด รอบนี้แยกเป็น 2 หน้า:
- "/" = หน้า landing ใหม่ ใช้แนะนำเว็บและพาไปดูน้อง ๆ
- "/pets" = หน้ารายการสัตว์เดิม (filter + pagination เหมือนเดิม)

**ขอบเขต:** แตะเฉพาะ `web/` (หน้า landing, router, ลิงก์ที่ชี้ "/") · ไม่แก้ `api/` · ไม่เพิ่ม endpoint · ไม่เปลี่ยน logic ของฟีเจอร์เดิม · ไม่เพิ่ม dependency · ใช้ token สีเดิมใน `index.css` (ไม่เพิ่มสีใหม่) · ไม่ commit

## สิ่งที่ตรวจเจอ (ลิงก์ที่ชี้ "/" อยู่ตอนนี้)
| ไฟล์ | จุด | หมายถึง | เปลี่ยนเป็น |
|---|---|---|---|
| `components/layout/Header.tsx:18` | เมนู "หาบ้านให้น้อง" (`end` เมื่อ to === '/') | รายการสัตว์ | `/pets` (คง `end` ไว้ ไม่ให้เมนูนี้ active ตอนอยู่หน้า `/pets/new`) |
| `components/layout/Header.tsx:44` | wordmark "บ้านใหม่" | หน้าแรก | คง `/` (ไป landing) |
| `pages/PetDetailPage.tsx:21` | ปุ่มย้อนกลับเมื่อไม่มี history | รายการสัตว์ | `/pets` |
| `pages/PetDetailPage.tsx:77` | "กลับไปดูน้อง ๆ" (ตอนหาไม่เจอ) | รายการสัตว์ | `/pets` |
| `pages/MyApplicationsPage.tsx:75` | "ไปดูน้อง ๆ" (empty state) | รายการสัตว์ | `/pets` |
| `pages/SavedPetsPage.tsx:35` | "ไปดูน้อง ๆ" (empty state) | รายการสัตว์ | `/pets` |
| `pages/NotFoundPage.tsx:14` | "กลับหน้าแรก" | หน้าแรก | คง `/` |
| `features/auth/redirect.ts` | `safeRedirect` fallback `'/'` + `loginPath` ไม่ใส่ `?redirect=` ถ้าเป็น `'/'` | หน้าหลังล็อกอิน | ดูข้อ 3 |
| `pages/LoginPage.tsx:55`, `RegisterPage.tsx:56,86` | เทียบ `redirectTo !== '/'` เพื่อไม่ต่อ `?redirect=` | ค่าเริ่มต้นหลังล็อกอิน | เทียบกับค่าคงที่ตัวเดียวกับข้อ 3 |

`pets/new` อยู่ใต้ `RequireAuth` อยู่แล้ว → ยังไม่ล็อกอินจะถูกพาไปหน้า login พร้อม `?redirect=/pets/new` เอง (ไม่ต้องแก้)

## งานที่จะทำ

### 1. Routing — `router.tsx`
- `index: true` → `LandingPage` (ใหม่)
- เพิ่ม `{ path: 'pets', element: <PetsListPage /> }` (react-router จับคู่แบบ ranked: `pets/new`, `pets/:id` ยังทำงานเหมือนเดิม)

### 2. อัปเดตลิงก์ตามตารางข้างบน
แก้แค่ค่า path ไม่แตะ logic อื่นในไฟล์

### 3. ค่าเริ่มต้นหลังล็อกอิน — `features/auth/redirect.ts`
- เพิ่มค่าคงที่ `DEFAULT_AFTER_AUTH = '/pets'` ใช้เป็น fallback ของ `safeRedirect` และใช้แทน `'/'` ในจุดเทียบของ `loginPath` / LoginPage / RegisterPage
- **เหตุผล:** ก่อนหน้านี้ "/" หมายถึงรายการสัตว์ ล็อกอินเสร็จแล้วจึงได้กลับไปดูน้อง ๆ ทันที ใช้ `/pets` เพื่อให้ได้พฤติกรรมเดิม
- `?redirect=/` (มาจาก landing) ยังใช้ได้ตามปกติ คือพากลับ landing

### 4. หน้ารายการ `/pets` — `pages/PetsListPage.tsx`
- ตัด hero ส่วนต้อนรับออก (ย้ายบทบาทไปที่ landing แล้ว ไม่ให้ซ้ำกัน) และไม่ต้องใช้ `-mt` ชดเชยแล้ว
- หัวข้อ "น้อง ๆ ที่กำลังรอบ้าน" กลับมาเป็น `h1` ของหน้า + จำนวนที่พบ แล้วตามด้วยแถบ filter แบบ sticky และกริดเดิม
- logic ของ filter/pagination/query ไม่เปลี่ยน

### 5. หน้า landing — `pages/LandingPage.tsx` + `features/landing/` (ใหม่)
ข้อมูล: ใช้ `usePetsList({ page: 1 })` ตัวเดิม (ได้ 12 ตัวล่าสุดที่ available เรียงตาม `created_at DESC` ตาม API) แล้วใช้แค่ 4 ตัวแรก
→ ไม่เพิ่ม endpoint/hook และใช้ cache ร่วมกับ `/pets` หน้า 1 ด้วย กดไป `/pets` แล้วขึ้นทันที

ส่วนต่าง ๆ (ภาษาไทยทั้งหมด ไม่มีตัวเลขสถิติ รีวิว หรือชื่อองค์กรที่แต่งขึ้น):
1. **Hero** — สองคอลัมน์ตั้งแต่ `lg` (มือถือ: ข้อความบน รูปล่าง)
   - ซ้าย: พาดหัว "ให้น้องได้มีบ้าน" (Anuphan ใหญ่ แบ่งวลีด้วย inline-block กันตัดบรรทัดกลางคำ) + คำอธิบาย 1–2 บรรทัด + ปุ่มหลัก "ดูน้อง ๆ ทั้งหมด" → `/pets` และปุ่มรอง (outline) "ลงประกาศหาบ้านให้น้อง" → `/pets/new`
   - ขวา: รูปใหญ่ของสัตว์ตัวแรกที่มี `image_url` จากข้อมูลที่ดึงมา (4:5 มุมโค้ง `--radius`) ใต้รูปมีชื่อ·ชนิด·จังหวัดเล็ก ๆ และทั้งรูปเป็นลิงก์ไปหน้าน้องตัวนั้น
   - ระหว่างโหลด: Skeleton ขนาดเดียวกับรูป · ไม่มีตัวไหนมีรูปหรือดึงข้อมูลไม่สำเร็จ: ใช้ `PetImage` placeholder (ไอคอนบนพื้น `muted`) ไม่ใช้รูปสต็อก
   - พื้น `bg-hero` เต็มความกว้างจอ (ใช้เทคนิค box-shadow + clip-path เดิม)
2. **น้อง ๆ ที่รอบ้าน** — หัวข้อ + ลิงก์ "ดูทั้งหมด →" ไป `/pets` ชิดขวา · กริด 2 คอลัมน์ (มือถือ) / 4 คอลัมน์ (`lg`) ใช้ `PetCard` เดิม (`hideAvailable`, `showSave`)
   - loading: `PetCardSkeleton` ×4 · empty: `EmptyState` + ปุ่มลงประกาศ · error: `ErrorState` + ลองใหม่ (ใช้ component เดิม)
3. **ทำงานยังไง** — 3 ขั้น เรียงแนวนอนตั้งแต่ `md` (มือถือเรียงลงมา) ไม่มีกล่องรอบขั้นตอน
   - ตัวเลข 1 2 3 ตัวใหญ่สี `primary` (Anuphan) + หัวข้อสั้น + คำอธิบาย 1 บรรทัด ตามที่ระบบทำจริง:
     1. เลือกน้อง — ดูโปรไฟล์และกรองตามชนิดสัตว์/จังหวัด
     2. ส่งคำขอรับเลี้ยง — ตอบคำถามสั้น ๆ ในหน้าของน้อง
     3. เจ้าของพิจารณา — เจ้าของอ่านคำขอแล้วอนุมัติหรือปฏิเสธ และคุณจะได้รับแจ้งเตือนในเว็บ
4. **ส่วนปิดท้าย** — แถบ `bg-hero` เต็มจอ: ข้อความเชิญชวนสั้น ๆ (เช่น "มีน้องที่ต้องการบ้านใหม่ไหม?") + ปุ่มหลัก "ลงประกาศหาบ้านให้น้อง" + ลิงก์รอง "ดูน้อง ๆ ทั้งหมด"
   - footer: ใช้ footer เรียบ ๆ ของ `AppLayout` ที่มีอยู่แล้ว (มีทุกหน้า) ไม่ทำซ้ำในหน้า landing
   - ส่วนปิดท้ายต้องชนกับ footer พอดี → ชดเชย padding ล่างของ `<main>` ด้วย `-mb` แบบเดียวกับ `-mt` ของ hero

ไฟล์ใหม่ (แยกตามส่วน อ่านง่าย อธิบายในสัมภาษณ์ได้):
- `pages/LandingPage.tsx` — ดึงข้อมูลครั้งเดียว แล้วส่งให้แต่ละส่วน
- `features/landing/LandingHero.tsx`, `LatestPets.tsx`, `HowItWorks.tsx`, `ClosingCta.tsx`

สไตล์: สีเน้นมีแค่ `primary` (#2F6B55) · ใช้ token เดิมเท่านั้น · หัวข้อ `h1/h2` ได้ Anuphan จาก base layer อยู่แล้ว · ระยะห่างระหว่างส่วนกว้าง (`py-16` → `lg:py-24`)
ไม่ใช้: การ์ดซ้อนการ์ด, `border-l-4`, ไอคอน Sparkles, gradient/blob, อีโมจิ, ส่วนสถิติหรือรีวิว

## ตรวจหลังทำเสร็จ
1. `grep` หา `to="/"`, `navigate('/')`, `'/'` ใน `web/src` → ต้องเหลือแค่ wordmark, NotFound และ landing เอง
2. `npm run build` + `npm run lint` ใน `web/`
3. ใช้ skill `frontend-design` ตรวจหน้า landing
4. รัน dev server แล้วถ่ายภาพหน้า landing ที่ 375px และ 1440px (full page) แล้วหยุดรอให้ดู · ไม่ commit
   - ข้อมูลจริงมาจาก API ที่ `VITE_API_URL` ใน dev ชี้อยู่ ถ้าตอนนั้นยังไม่มี API/DB ให้ใช้ จะถ่ายภาพ state ที่ได้จริง (loading/error) แล้วแจ้ง ไม่ปลอมข้อมูล
