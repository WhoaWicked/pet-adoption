# Plan: frontend-mvp — รอบที่ 3 (คำขอของฉัน + ที่บันทึกไว้ + ลงประกาศ)

spec: `_specs/frontend-mvp.md` (หน้า 4, 5, 7) · branch: `claude/feature/frontend-mvp` · ต่อจาก `_plans/frontend-mvp-round2.md` (commit `d26b1b2`)

## Context
หลังรอบที่ 2 ผู้ใช้ดูรายละเอียด บันทึก และยื่นคำขอได้แล้ว แต่ปลายทางของ flow ยังเป็นหน้า "กำลังพัฒนา" อยู่ 3 หน้า: ข้อความยืนยันการยื่นลิงก์ไป `/my-applications`, ปุ่ม "ลงประกาศ" ไป `/pets/new` และเมนู `/saved` รอบนี้ทำ 3 หน้านี้ให้ใช้งานจริง จบรอบแล้วหยุดรอผู้พัฒนา

**ขอบเขต:** `/my-applications`, `/saved`, `/pets/new` เท่านั้น ใช้ api client และ query keys เดิม แตะเฉพาะ `web/` ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ ไม่ commit

## ข้อเท็จจริงที่ตรวจแล้ว
- `GET /applications/mine?limit&offset` → `{ data, meta }` (limit 1–50, default 20) เรียงใหม่สุดก่อน แต่ละแถวเป็น application row + `pet_name`, `pet_status`
- `PATCH /applications/:id/withdraw` → application row ที่อัปเดตแล้ว; ถอนซ้ำตอนเป็น `withdrawn` อยู่แล้วตอบสำเร็จ; สถานะอื่นที่ไม่ใช่ pending → 409 `Only pending applications can be withdrawn`; ชนกันระหว่างอัปเดต → 409 `Application cannot be withdrawn` (ทั้งคู่มีข้อความไทยใน `errors.ts` แล้ว)
- `GET /pets/saved` → array ทุกสถานะ · `DELETE /pets/:id/save` body ว่าง
- `POST /pets` body ตาม `CreatePetDto`: `name`, `species` (dog|cat|other), `ageMonths` (int ≥ 0), `province`, `description`, `requirements` (ทั้งหมดห้ามว่าง), `imageUrl?` (string) → pet row
- `GET /pets/mine` ยังไม่มีใน `api/src/pets/pets.controller.ts` → `/my-pets/:petId` ยังเป็น placeholder ดังนั้นสร้างโพสต์สำเร็จแล้ว**ไปหน้ารายละเอียด** `/pets/:id`
- ของเดิมที่ใช้ซ้ำ: `apiRequest`, `getErrorMessage`, `getValidationErrors`, `queryKeys` (`applications.mine(page)`, `applications.all`, `pets.saved`, `pets.all`, `pets.mine`), `useSavedPets` (`features/pets/use-saved-pets.ts`), `PetCard` / `PetCardSkeleton`, `PetStatusBadge`, `Pagination`, `PageHeader`, `EmptyState`, `ErrorState`, `FormField`, `fieldAria`, `PROVINCES`, labels (`APPLICATION_STATUS_LABELS`, `SPECIES_LABELS`)

## ขั้นตอน

### 1. shadcn
- `npx shadcn@4.23.0 add alert-dialog -y` สำหรับ confirm การถอนคำขอ (หน้าจัดการรอบหน้าใช้ต่อ)

### 2. types + endpoints
- `types.ts`: `MyApplication` = `Application` + `pet_name`, `pet_status`
- `endpoints.ts`:
  - `listMyApplications({ limit, offset })`
  - `withdrawApplication(id)` (PATCH)
  - `createPet(input)` ส่งเฉพาะ field ของ DTO และไม่ส่ง `imageUrl` เมื่อว่าง

### 3. หน้า `/my-applications` — `features/applications/` + `pages/MyApplicationsPage.tsx`
- page ใน URL (`?page=`) หน้าละ 10 → `useQuery(queryKeys.applications.mine(page))` + `keepPreviousData`
- แต่ละรายการ (Card แถวเดียว จอเล็กซ้อนเป็นแนวตั้ง): ชื่อสัตว์ลิงก์ไป `/pets/:pet_id`, `ApplicationStatusBadge` (สีจาก token เดิม: pending ใช้ secondary, approved ใช้ status-available, rejected/withdrawn ใช้ status-closed), วันที่ยื่นรูปแบบไทย (`toLocaleDateString('th-TH')`), สรุปคำตอบสั้น ๆ (ที่พัก · เคย/ไม่เคยเลี้ยง)
- ปุ่ม "ถอนคำขอ" เฉพาะ `pending` → `AlertDialog` ยืนยัน → `useWithdrawApplication`
  - สำเร็จ → `setQueryData` แก้สถานะแถวนั้นในหน้าปัจจุบันทันที แล้ว invalidate `applications.all` + toast
  - error (เช่น 409) → toast ข้อความไทย แล้ว invalidate เพื่อโหลดสถานะจริง
  - ปุ่มใน dialog disable ระหว่างรอ
- สถานะ: skeleton / ErrorState + ลองใหม่ / empty "ยังไม่ได้ยื่นคำขอ" + ปุ่มไปหน้ารายการ / page เกิน → กลับหน้าแรก

### 4. หน้า `/saved` — `pages/SavedPetsPage.tsx`
- ใช้ `useSavedPets()` เดิม แสดง grid ด้วย `PetCard` (ป้ายสถานะมีอยู่แล้วบนการ์ด ครอบคลุม "ปิดรับแล้ว"/"มีบ้านแล้ว")
- ปุ่ม "เลิกบันทึก" ใต้การ์ดแต่ละใบ (นอกลิงก์ของการ์ด) → mutation `unsavePet`
  - สำเร็จ → `setQueryData` เอาตัวนั้นออกจากรายการทันที แล้ว invalidate `pets.saved` + toast
  - ปุ่ม disable เฉพาะใบที่กำลังรอ
- สถานะ: skeleton grid / ErrorState / empty "ยังไม่ได้บันทึกน้องตัวไหน" + ปุ่มไปหน้ารายการ
- ปรับ `useToggleSave` ให้ใช้ logic เดียวกันได้ (แยก `useUnsave` ที่รับ petId ตอนเรียก)

### 5. หน้า `/pets/new` — `features/pets/CreatePetForm.tsx` + `pages/CreatePetPage.tsx`
- ช่อง: ชื่อ, ชนิด (Select), อายุเป็น 2 ช่อง "ปี" + "เดือน" (จำนวนเต็ม ≥ 0, เดือน 0–11) แล้วรวมเป็น `ageMonths` ก่อนส่ง, จังหวัด (Select 77 จังหวัด), คำอธิบาย (Textarea), เงื่อนไขการรับเลี้ยง (Textarea), ลิงก์รูป (ไม่บังคับ, ตรวจว่าเป็น http/https)
- ตรวจฝั่ง client ทุกช่องตาม DTO; field error จาก `details` แสดงใต้ช่อง (`ageMonths` แสดงใต้กลุ่มอายุ) ที่จับคู่ไม่ได้รวมเป็น Alert
- ปุ่ม "ลงประกาศ" สีหลัก disable + "กำลังลงประกาศ…" ระหว่างรอ
- สำเร็จ → invalidate `pets.all` (หน้ารายการ) + `pets.mine` → toast → ไป `/pets/:id` ของตัวที่สร้าง (replace)

### 6. router
- `my-applications` → `MyApplicationsPage`, `saved` → `SavedPetsPage`, `pets/new` → `CreatePetPage` (ยังอยู่ใต้ `RequireAuth`)
- `my-pets`, `my-pets/:petId` ยังเป็น `ComingSoonPage`

## ไฟล์ที่แก้/สร้าง
- แก้: `web/src/lib/types.ts`, `web/src/lib/api/endpoints.ts`, `web/src/features/pets/use-saved-pets.ts`, `web/src/router.tsx`
- สร้าง: `web/src/components/ui/alert-dialog.tsx` (shadcn), `web/src/features/applications/{use-my-applications.ts,ApplicationStatusBadge.tsx,MyApplicationItem.tsx}`, `web/src/features/pets/{use-create-pet.ts,CreatePetForm.tsx}`, `web/src/pages/{MyApplicationsPage,SavedPetsPage,CreatePetPage}.tsx`

## Verification
1. `npm run build` + `npm run lint` ผ่าน (ยกเว้น warning เดิมของ shadcn), `git status` เห็นแค่ `web/` และ `_plans/`
2. ถ้า API รันอยู่ ยิง request แบบเดียวกับที่หน้าส่งผ่าน Vite proxy:
   - `/applications/mine?limit=10&offset=0` ได้ `pet_name`/`pet_status`, ถอน pending สำเร็จ, ถอนรายการที่ approved/rejected ได้ 409
   - `POST /pets` ด้วย body จากฟอร์ม (ไม่มี `imageUrl`) สำเร็จ, ส่ง `ageMonths` เป็น string แล้วได้ VALIDATION_FAILED ที่จับคู่ช่องได้
   - unsave แล้ว `/pets/saved` ไม่มีตัวนั้น
3. ตรวจใน browser เอง (ผมเปิด browser ไม่ได้): confirm dialog, การหายของการ์ดหลังเลิกบันทึก, pagination, จอ 375px
4. สรุปว่าแต่ละส่วนทำอะไร แล้วหยุดรอ (ไม่ commit)
