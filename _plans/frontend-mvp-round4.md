# Plan: frontend-mvp — รอบที่ 4 (สัตว์ของฉัน + หน้าจัดการ)

spec: `_specs/frontend-mvp.md` (หน้า 6) · branch: `claude/feature/frontend-mvp` (merge `main` ที่มี `GET /pets/mine` แล้ว, `eef5b4d`) · ต่อจาก `_plans/frontend-mvp-round3.md`

## Context
ฝั่งผู้ยื่นใช้งานได้ครบแล้ว แต่ฝั่งเจ้าของยังจบที่หน้า "กำลังพัฒนา": เมนู "สัตว์ของฉัน" และลิงก์ "ไปหน้าจัดการ" จากหน้ารายละเอียด รอบนี้ทำ `/my-pets` (รายการ) และ `/my-pets/:petId` (ดูคำขอ, อนุมัติ/ปฏิเสธ, ปิดโพสต์) ซึ่งเป็นครึ่งหลังของ flow demo ใน Acceptance Criteria

**ขอบเขต:** สองหน้านี้เท่านั้น ใช้ api client, query keys และ `ConfirmDialog` เดิม แตะเฉพาะ `web/` ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ ไม่ commit · เมื่ออนุมัติแผน: เซฟเป็น `_plans/frontend-mvp-round4.md` ก่อนเริ่มเขียนโค้ด

## ข้อเท็จจริงที่ตรวจแล้ว (อ่านจาก `api/src/` จริง)
- `GET /pets/mine` (`pets.controller.ts`, ต้อง login) → **array** ของ pet row ทุกสถานะ เรียง `created_at DESC` ไม่มี `meta` · route อยู่ก่อน `:id` แล้ว
- `GET /applications/pet/:petId` → **`{ data: [...] }`** (ไม่ใช่ array ตรง ๆ อย่างที่ spec เขียน) แต่ละแถวเป็น application row + `applicant_name` · ไม่ใช่เจ้าของ → 403 `You do not own this pet` · สัตว์ไม่พบ → 404
- `PATCH /applications/:id/approve` → application row
  - ใน transaction: ล็อกสัตว์, **ถ้าสัตว์ไม่ใช่ `available` → 409 `Application cannot be approved`**, คำขอไม่ใช่ pending → 409 `Only pending applications can be approved`
  - สำเร็จแล้วคำขอ pending อื่นของสัตว์ตัวนี้เป็น `rejected` และสัตว์เป็น `adopted`
- `PATCH /applications/:id/reject` → application row; ไม่ใช่ pending → 409 (ปฏิเสธได้แม้สัตว์ปิดโพสต์แล้ว)
- `PATCH /pets/:id/close` → pet row; adopted → 409 `Pet is already adopted`; closed อยู่แล้ว → สำเร็จ
- ข้อความไทยของ 403/409 ทุกตัวข้างบนมีใน `web/src/lib/api/errors.ts` แล้ว
- ของเดิมที่ใช้ซ้ำ: `usePet` (`features/pets/use-pet.ts`), `PetCard`/`PetCardSkeleton` (รับ prop `to` ได้อยู่แล้ว), `PetImage`, `PetStatusBadge`, `ApplicationStatusBadge`, `ConfirmDialog`, `formatAge`/`formatDate`, labels, `useAuth().userId`, `isNotFoundError`, `PageHeader`/`EmptyState`/`ErrorState`, `queryKeys.pets.mine` / `pets.detail(id)` / `pets.lists` / `applications.byPet(petId)`

## ขั้นตอน

### 1. types + endpoints
- `types.ts`: `PetApplication` = `Application` + `applicant_name`
- `endpoints.ts`: `listMyPets()` → `Pet[]`, `listPetApplications(petId)` → แกะ `{ data }` คืน `PetApplication[]`, `approveApplication(id)`, `rejectApplication(id)`, `closePet(id)`

### 2. หน้า `/my-pets` — `pages/MyPetsPage.tsx` + `features/pets/use-my-pets.ts`
- `useQuery(queryKeys.pets.mine)` → grid ของ `PetCard` โดยส่ง `to={/my-pets/:id}` (ป้ายสถานะบนการ์ดครอบคลุมทุกสถานะ)
- header มีปุ่ม "ลงประกาศ" · loading = skeleton grid · error = ErrorState + ลองใหม่ · empty = "ยังไม่ได้ลงประกาศ" + ปุ่มไป `/pets/new`

### 3. หน้า `/my-pets/:petId` — `pages/ManagePetPage.tsx` + `features/owner/`
- **ข้อมูลสัตว์:** `usePet(petId)` → แถวสรุป (รูปเล็ก, ชื่อ, ป้ายสถานะ, ชนิด · อายุ · จังหวัด) + ลิงก์ "ดูหน้าประกาศ" ไป `/pets/:id`
- **เช็คความเป็นเจ้าของ:** ถ้า `pet.owner_id !== userId` → แสดงสถานะ 403 "คุณไม่ใช่เจ้าของโพสต์นี้" ทันที ไม่ยิง request คำขอ · ถ้า request คำขอได้ 403 ก็แสดงแบบเดียวกัน
- **404 / id ผิดรูปแบบ** → EmptyState "ไม่พบข้อมูลสัตว์ตัวนี้" + ลิงก์กลับ `/my-pets`
- **ปุ่มปิดโพสต์:** แสดงเฉพาะเมื่อ `available` → `ConfirmDialog` ("ปิดรับคำขอแล้วจะเปิดใหม่ไม่ได้ คำขอที่รออยู่ยังอยู่ในรายการ") → `useClosePet`
- **รายการคำขอ** `useQuery(queryKeys.applications.byPet(petId))` (เปิดเมื่อยืนยันว่าเป็นเจ้าของแล้ว)
  - เรียง pending ขึ้นก่อน แล้วตามเดิม (ใหม่สุดก่อน)
  - แต่ละการ์ด: `applicant_name`, `ApplicationStatusBadge`, วันที่ยื่น, คำตอบเต็ม (ที่พัก, เคย/ไม่เคยเลี้ยง, note แบบ `whitespace-pre-line break-words`)
  - ปุ่ม "ปฏิเสธ" (outline) เฉพาะ pending · ปุ่ม "อนุมัติ" (สีหลัก) เฉพาะ pending **และสัตว์ยัง available** (ไม่งั้น API ตอบ 409 แน่นอน)
  - อนุมัติ → `ConfirmDialog` บอกชัดว่า "คำขออื่นของ {ชื่อสัตว์} ที่รออยู่ (N รายการ) จะถูกปฏิเสธอัตโนมัติ และน้องจะเปลี่ยนเป็น มีบ้านแล้ว"
  - ปฏิเสธ → `ConfirmDialog` แบบ destructive
  - loading = skeleton · error = ErrorState · empty = "ยังไม่มีคำขอเข้ามา"
- **mutations** (`features/owner/use-owner-actions.ts`): approve / reject / close
  - ทุกตัว `onSettled` → invalidate `pets.detail(petId)`, `applications.byPet(petId)`, `pets.mine`, `pets.lists` (สถานะสัตว์เปลี่ยนต้องสะท้อนทุกที่)
  - สำเร็จ → toast · error (409 ชนกัน/403) → toast ข้อความไทย แล้วข้อมูลโหลดใหม่จาก invalidate เดียวกัน
  - ปุ่มทุกปุ่ม disable ระหว่างมี action ใดรออยู่ในหน้า (กันอนุมัติสองรายการซ้อนกัน)

### 4. router
- `my-pets` → `MyPetsPage`, `my-pets/:petId` → `ManagePetPage` (ใต้ `RequireAuth`)
- ลบ `ComingSoonPage` ถ้าไม่มี route ไหนใช้แล้ว

## ไฟล์ที่แก้/สร้าง
- แก้: `web/src/lib/types.ts`, `web/src/lib/api/endpoints.ts`, `web/src/router.tsx`
- สร้าง: `web/src/features/pets/use-my-pets.ts`, `web/src/features/owner/{use-owner-actions.ts,use-pet-applications.ts,PetApplicationCard.tsx,ManagePetHeader.tsx}`, `web/src/pages/{MyPetsPage,ManagePetPage}.tsx`, `_plans/frontend-mvp-round4.md`
- อาจลบ: `web/src/pages/ComingSoonPage.tsx`

## Verification
1. `npm run build` + `npm run lint` ผ่าน (ยกเว้น warning เดิมของ shadcn), `git status` เห็นแค่ `web/` และ `_plans/`
2. ถ้า API รันอยู่ ยิง request แบบเดียวกับหน้าผ่าน Vite proxy (body ภาษาไทยส่งจากไฟล์ UTF-8):
   - `/pets/mine` ได้ทุกสถานะ (สร้างแล้วปิด 1 ตัว), ผู้ใช้ใหม่ได้ `[]`
   - `/applications/pet/:id` ของเจ้าของได้ `{ data }` + `applicant_name`, ของคนอื่นได้ 403
   - คำขอ 2 รายการ → อนุมัติ 1 → อีกรายการเป็น rejected และสัตว์เป็น adopted · อนุมัติรายการที่เหลือซ้ำ → 409
   - ปิดโพสต์สัตว์ที่ adopted → 409 `Pet is already adopted`
3. ตรวจใน browser เอง: dialog ยืนยัน, ปุ่มหาย/disable ถูกจังหวะ, จอ 375px
4. สรุปว่าแต่ละส่วนทำอะไร แล้วหยุดรอ (ไม่ commit)
