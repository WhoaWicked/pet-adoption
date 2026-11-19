# Plan: frontend-mvp — รอบที่ 2 (หน้ารายละเอียดสัตว์ + บันทึก + ยื่นคำขอ)

spec: `_specs/frontend-mvp.md` (หน้า 3) · branch: `claude/feature/frontend-mvp` · ต่อจาก `_plans/frontend-mvp-round1.md` (commit `af5f376`)

## Context
รอบที่ 1 วางฐานไว้แล้ว (api client, error ภาษาไทย, auth, layout, หน้ารายการสัตว์) แต่การ์ดสัตว์ยังพาไปหน้า "กำลังพัฒนา" รอบนี้ทำหน้า `/pets/:id` ให้ใช้งานจริง: ดูรายละเอียด, บันทึก/เลิกบันทึก และยื่นคำขอรับเลี้ยง ซึ่งเป็นจุดกลางของ flow demo จบรอบแล้วหยุดรอผู้พัฒนา

**ขอบเขต:** หน้า `/pets/:id` เท่านั้น ใช้ api client และ query keys เดิม แตะเฉพาะ `web/` ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ ไม่ commit · ก่อนเริ่ม implement คัดลอกแผนนี้ไปไว้ที่ `_plans/frontend-mvp-round2.md`

## ข้อเท็จจริงที่ตรวจแล้ว
- `GET /pets/:id` ไม่ต้อง login, คืน pet ทุกสถานะ, ไม่พบ → 404, id ไม่ใช่ UUID → 400 (`ParseUUIDPipe`)
- `GET /pets/saved` คืน array ของ pet (ไม่มี meta) · `PUT` / `DELETE /pets/:id/save` คืน body ว่าง ทำซ้ำได้
- `POST /applications` body `{ petId, answers: { housingType, hasPetExperience, note? (≤ 500) } }` · 403 ขอสัตว์ตัวเอง, 409 สัตว์ไม่ available / ยื่นซ้ำ
- ไม่มี endpoint บอกล่วงหน้าว่าเคยยื่นสัตว์ตัวนี้แล้วหรือยัง → ให้ API ตัดสินผ่าน 409
- `GET /pets/mine` ยังไม่มีใน `api/src/pets/pets.controller.ts` (ไม่กระทบรอบนี้ ลิงก์ของเจ้าของชี้ไป `/my-pets/:petId` ที่ยังเป็น placeholder)
- ของเดิมที่ใช้ซ้ำ: `apiRequest` (`web/src/lib/api/client.ts`), `getErrorMessage` / `isNotFoundError` (`web/src/lib/api/errors.ts`), `queryKeys.pets.detail` / `pets.saved` / `applications.all` (`web/src/lib/query/query-keys.ts`), `useAuth` (`status`, `userId`), `loginPath` (`features/auth/redirect.ts`), `PetImage`, `PetStatusBadge`, `formatAge`, labels, `FormField`, `fieldAria`, `ErrorState`, `EmptyState`, `LoadingState`

## ขั้นตอน

### 1. เพิ่ม component ของ shadcn
- `npx shadcn@4.23.0 add textarea radio-group -y` (ช่อง note และตัวเลือก เคย/ไม่เคย เลี้ยงสัตว์)

### 2. types + endpoints — `web/src/lib/`
- `types.ts`: เพิ่ม `ApplicationAnswers` (`housingType`, `hasPetExperience`, `note?`) และ `Application` (row snake_case: `id`, `pet_id`, `applicant_id`, `answers`, `status`, `created_at`, `decided_at`)
- `api/endpoints.ts`: เพิ่ม `getPet(id)` (`auth: false`), `listSavedPets()`, `savePet(id)` (PUT), `unsavePet(id)` (DELETE), `createApplication({ petId, answers })` — ส่ง `note` เฉพาะเมื่อไม่ว่าง (body ตรง DTO)

### 3. hooks — `web/src/features/pets/` และ `web/src/features/applications/`
- `use-pet.ts` → `useQuery(queryKeys.pets.detail(id))`
- `use-saved-pets.ts`
  - `useSavedPetIds()` → `useQuery(queryKeys.pets.saved)` เปิดเฉพาะตอน `authenticated` คืน `Set` ของ id
  - `useToggleSave(petId)` → mutation เรียก `savePet` หรือ `unsavePet` แล้ว invalidate `queryKeys.pets.saved`, แจ้งผลด้วย toast, error แสดงด้วย `getErrorMessage`
- `features/applications/use-create-application.ts` → mutation `createApplication`
  - สำเร็จ → invalidate `queryKeys.applications.all`
  - 409 → invalidate `queryKeys.pets.detail(petId)` เพื่อโหลดสถานะสัตว์ใหม่

### 4. component
- `features/pets/SaveButton.tsx` — ปุ่ม outline ไอคอนหัวใจ (เต็มเมื่อบันทึกแล้ว)
  - ยังไม่ login → `navigate(loginPath(pathname))` แล้วกลับมาหน้านี้หลัง login
  - กำลังเช็คสถานะ หรือ mutation รออยู่ → disable
- `features/applications/ApplyForm.tsx`
  - `housingType`: Select 4 ตัวเลือก (label ไทย) ต้องเลือก
  - `hasPetExperience`: RadioGroup เคย/ไม่เคย ต้องเลือก
  - `note`: Textarea, `maxLength` 500 + ตัวนับ `x/500` และตรวจ ≤ 500 ฝั่ง client อีกชั้น
  - field error ใต้ช่องทั้งจาก client และจาก `getValidationErrors` (`details`)
  - error อื่นแสดงเป็น Alert ข้อความไทย (409 ยื่นซ้ำ / สัตว์ไม่ available, 403)
  - ปุ่มส่งเป็นสีหลัก disable + "กำลังส่งคำขอ…" ระหว่างรอ
  - สำเร็จ → ซ่อนฟอร์ม แสดง Alert ยืนยัน + ลิงก์ไป `/my-applications`
- `features/pets/AdoptionPanel.tsx` — ตัดสินว่าจะแสดงอะไรในกล่องรับเลี้ยง (เรียงตามลำดับ):
  1. ผู้ใช้เป็นเจ้าของ (`userId === pet.owner_id`) → ข้อความ "นี่คือโพสต์ของคุณ" + ปุ่มไป `/my-pets/:petId`
  2. สัตว์ `adopted` → "น้องมีบ้านแล้ว" · `closed` → "ประกาศนี้ปิดรับแล้ว"
  3. ยังไม่ login → คำอธิบาย + ปุ่ม "เข้าสู่ระบบเพื่อยื่นคำขอ" (พก redirect)
  4. กำลังเช็ค login (`checking`) → skeleton
  5. ไม่งั้น → `ApplyForm`

### 5. หน้า `web/src/pages/PetDetailPage.tsx` + router
- loading → skeleton ตามโครงหน้า
- `isNotFoundError` (404 หรือ id ผิดรูปแบบ) → EmptyState "ไม่พบข้อมูลสัตว์ตัวนี้" + ปุ่มกลับหน้ารายการ
- error อื่น → `ErrorState` + ลองใหม่
- layout:
  - ลิงก์ "← กลับไปดูน้อง ๆ" (`navigate(-1)` ถ้ามีประวัติ ไม่งั้นไป `/`)
  - จอใหญ่ 2 คอลัมน์ (รูป 4:3 มุมโค้ง | ชื่อ + ป้ายสถานะ + ชนิด · อายุ + จังหวัด + `SaveButton`)
  - ด้านล่าง: หัวข้อ "เกี่ยวกับน้อง" (description) และ "เงื่อนไขการรับเลี้ยง" (requirements) ใช้ `whitespace-pre-line break-words` กันข้อความยาวล้นบนมือถือ
  - กล่อง `AdoptionPanel`
  - มือถือเป็นคอลัมน์เดียว
- `router.tsx`: เปลี่ยน `pets/:id` จาก `ComingSoonPage` เป็น `PetDetailPage`

## ไฟล์ที่แก้/สร้าง
- แก้: `web/src/lib/types.ts`, `web/src/lib/api/endpoints.ts`, `web/src/router.tsx`
- สร้าง: `web/src/features/pets/{use-pet,use-saved-pets}.ts`, `web/src/features/pets/{SaveButton,AdoptionPanel}.tsx`, `web/src/features/applications/{use-create-application.ts,ApplyForm.tsx}`, `web/src/pages/PetDetailPage.tsx`, `web/src/components/ui/{textarea,radio-group}.tsx` (สร้างโดย shadcn), `_plans/frontend-mvp-round2.md`

## Verification
1. `cd web && npm run build` และ `npm run lint` ผ่าน (ยกเว้น warning เดิม 2 ตัวในไฟล์ของ shadcn), `git status` เห็นแค่ `web/` และ `_plans/`
2. ถ้า API + DB รันได้ ตรวจด้วยมือด้วยผู้ใช้ 2 คน:
   - `/pets/<uuid ที่ไม่มี>` และ `/pets/abc` → "ไม่พบข้อมูล"
   - ยังไม่ login: เห็นรายละเอียด, กดบันทึก → ไป login → กลับมาหน้าเดิม, กล่องรับเลี้ยงมีปุ่มเข้าสู่ระบบ
   - ผู้ใช้ B: กดบันทึก/เลิกบันทึก → ไอคอนเปลี่ยน, Network เห็น PUT/DELETE แล้ว GET `/pets/saved`, ปุ่ม disable ระหว่างรอ
   - ส่งฟอร์มเปล่า → error ใต้ช่อง, note 500 ตัวพิมพ์ต่อไม่ได้, ส่งสำเร็จ → ข้อความยืนยัน + ลิงก์, body ใน Network ไม่มี field เกิน DTO
   - refresh แล้วยื่นซ้ำ → "คุณยื่นคำขอสัตว์ตัวนี้ไปแล้ว"
   - ผู้ใช้ A (เจ้าของ) → เห็นลิงก์ไปหน้าจัดการแทนฟอร์ม
   - ปิดโพสต์ระหว่างที่ B เปิดฟอร์มค้าง (ผ่าน API) แล้ว B กดส่ง → 409 ข้อความไทย และกล่องเปลี่ยนเป็น "ปิดรับแล้ว"
   - จอ 375px ไม่มี horizontal scroll
3. ถ้า API ยังรันไม่ได้ ระบุในสรุปตรง ๆ ว่ายังไม่ได้ทดสอบ end-to-end
4. สรุปให้ผู้พัฒนา: อธิบายสั้น ๆ ว่าแต่ละส่วนทำอะไร แล้วหยุดรอ (ไม่ commit)
