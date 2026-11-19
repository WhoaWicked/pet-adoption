# Plan: frontend-mvp — รอบที่ 5 (กระดิ่งแจ้งเตือน)

spec: `_specs/frontend-mvp.md` (หน้า 8) · branch: `claude/feature/frontend-mvp` · ต่อจาก `_plans/frontend-mvp-round4.md` (commit `3b93564`)

## Context
ทุกหน้าใน spec ทำเสร็จแล้ว เหลือกระดิ่งแจ้งเตือน ซึ่งเป็นตัวเชื่อม flow demo ระหว่างผู้ใช้ 2 คน: เจ้าของรู้ว่ามีคำขอใหม่ และผู้ยื่นรู้ว่าได้รับอนุมัติ/ไม่ได้รับเลือก โดยไม่ต้อง refresh หน้า (poll ~30 วินาที ไม่ใช่ real-time) รอบนี้ทำกระดิ่งใน header แล้วหยุดรอผู้พัฒนา

**ขอบเขต:** กระดิ่งใน header เท่านั้น ใช้ api client และ query keys เดิม แตะเฉพาะ `web/` ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ ไม่ commit · เมื่ออนุมัติแผน: เซฟเป็น `_plans/frontend-mvp-round5.md` ก่อนเริ่มเขียนโค้ด

## ข้อเท็จจริงที่ตรวจแล้ว (อ่านจาก `api/src/notifications/` จริง)
- `GET /notifications?limit&offset` → `{ data, meta }` เรียง `created_at DESC, id DESC` · แถว: `id` (**string** จาก BIGSERIAL), `user_id`, `type`, `entity_id`, `message`, `read_at` (null = ยังไม่อ่าน), `created_at`
- `GET /notifications/unread-count` → `{ count }`
- `PATCH /notifications/:id/read` → แถวที่อัปเดต · ใช้ `ParseIntPipe` (ส่ง id string ใน path ได้ตามปกติ) · ไม่พบ/ไม่ใช่ของตัวเอง → 404 · กดซ้ำไม่เขียนทับ `read_at` เดิม
- ทุก endpoint ต้อง login
- `type` ที่ API สร้างจริง: `application.received`, `application.approved`, `application.rejected` · `entity_id` = id ของคำขอ
- 401 ระหว่าง poll: `apiRequest` เรียก unauthorized handler ใน `AuthProvider` ซึ่งมี ref `handlingUnauthorized` กันเด้งซ้ำอยู่แล้ว และ `logout()` เรียก `queryClient.clear()` → ไม่ต้องเพิ่ม logic ใหม่ แค่ให้ query ปิดเมื่อไม่ใช่ `authenticated`
- ยังไม่มี `components/ui/popover.tsx` → ต้อง `shadcn add popover`
- ของเดิมที่ใช้ซ้ำ: `apiRequest`, `getErrorMessage`, `queryKeys.notifications.{all,list,unreadCount}`, `useAuth().status`, `Header.tsx` (มีตำแหน่งเว้นไว้แล้ว), `Skeleton`, `Button`, `formatDate`

## ขั้นตอน

### 1. shadcn + types + endpoints
- `npx shadcn@4.23.0 add popover -y`
- `types.ts`: `Notification` (`id: string`, `type: string`, `entity_id`, `message`, `read_at: string | null`, `created_at`)
- `endpoints.ts`: `listNotifications({ limit, offset })`, `getUnreadCount()` → `{ count }`, `markNotificationRead(id: string)`

### 2. util — `web/src/lib/format.ts`
- `formatRelativeTime(iso)`: < 1 นาที "เมื่อสักครู่", < 60 นาที "X นาทีที่แล้ว", < 24 ชม. "X ชั่วโมงที่แล้ว", < 7 วัน "X วันที่แล้ว", เกินนั้นใช้ `formatDate` เดิม

### 3. hooks — `web/src/features/notifications/`
- `use-unread-count.ts`: `useQuery(queryKeys.notifications.unreadCount)`, `enabled: status === 'authenticated'`, `refetchInterval: 30_000` (TanStack หยุด poll เองเมื่อแท็บไม่ active และเมื่อ `enabled` เป็น false หลัง logout)
- `use-notifications.ts`: `useQuery(queryKeys.notifications.list)` limit 10, `enabled` เฉพาะตอน authenticated **และ popover เปิด**, `staleTime: 0` → เปิดทุกครั้งได้รายการล่าสุด
- `use-mark-read.ts`: mutation `markNotificationRead`
  - `onMutate`: ลด `unreadCount` ใน cache ลง 1 (ไม่ต่ำกว่า 0) และตั้ง `read_at` ของรายการนั้นในลิสต์ → badge ลดทันที
  - `onError`: ไม่บล็อกการนำทาง (นำทางไปแล้วตั้งแต่ตอนกด)
  - `onSettled`: invalidate `notifications.all` (ทั้ง count และ list) → ถ้าล้มเหลวตัวเลขจะกลับมาตรงกับ server
- `notification-content.ts`: map `type` → ข้อความไทย + ปลายทาง
  - `application.received` → "มีคนยื่นคำขอรับเลี้ยงน้องของคุณ" → `/my-pets`
  - `application.approved` → "คำขอของคุณได้รับการอนุมัติ" → `/my-applications`
  - `application.rejected` → "คำขอของคุณไม่ได้รับเลือก" → `/my-applications`
  - type อื่นที่ไม่รู้จัก → "มีการแจ้งเตือนใหม่" ไม่มีปลายทาง (แค่ mark read)

### 4. component — `NotificationBell.tsx`
- ปุ่มไอคอนกระดิ่ง (`aria-label` บอกจำนวนที่ยังไม่อ่าน) + badge สีหลักมุมขวาบน: ซ่อนเมื่อ 0, แสดง "9+" เมื่อ > 9
- `Popover` (ควบคุม `open`) กว้าง ~ `w-80` และไม่เกินความกว้างจอมือถือ:
  - หัว "การแจ้งเตือน"
  - loading → skeleton 3 แถว · error → ข้อความไทยจาก `getErrorMessage` + ปุ่มลองใหม่ · empty → "ยังไม่มีการแจ้งเตือน"
  - แต่ละรายการเป็นปุ่มเต็มแถว: จุดสีหลัก + ตัวหนา + พื้นจางสำหรับที่ยังไม่อ่าน, ที่อ่านแล้วตัวปกติสีจาง · ข้อความไทยตาม type · เวลาแบบสัมพัทธ์
  - กด → ถ้ายังไม่อ่านเรียก mark read (ไม่รอผล) → ปิด popover → `navigate` ไปปลายทาง
- `Header.tsx`: วางกระดิ่งในแถบบนสุดเมื่อ `authenticated` ทุกขนาดจอ (มือถืออยู่ข้างปุ่มเมนู ไม่ซ่อนใน Sheet เพราะ popover ซ้อนใน Sheet ใช้ยาก) · ซ่อนเมื่อยังไม่ login / กำลังเช็ค

## ไฟล์ที่แก้/สร้าง
- แก้: `web/src/lib/types.ts`, `web/src/lib/api/endpoints.ts`, `web/src/lib/format.ts`, `web/src/components/layout/Header.tsx`
- สร้าง: `web/src/components/ui/popover.tsx` (shadcn), `web/src/features/notifications/{use-unread-count,use-notifications,use-mark-read,notification-content}.ts`, `web/src/features/notifications/NotificationBell.tsx`, `_plans/frontend-mvp-round5.md`

## Verification
1. `npm run build` + `npm run lint` ผ่าน (ยกเว้น warning เดิมของ shadcn), `git status` เห็นแค่ `web/` และ `_plans/`
2. ถ้า API รันอยู่ ยิง request แบบเดียวกับกระดิ่งผ่าน Vite proxy:
   - B ยื่นคำขอ → A ได้ `unread-count` เพิ่ม 1 และรายการมี `application.received` ที่ `id` เป็น string
   - A อนุมัติ → B ได้ `application.approved` ส่วนผู้ยื่นคนอื่นได้ `application.rejected`
   - `PATCH /notifications/:id/read` → count ลด 1, กดซ้ำยังสำเร็จ, id ของคนอื่น → 404
   - token เสีย → `unread-count` ได้ 401
3. ตรวจใน browser เอง: badge ขึ้นภายใน ~30 วินาทีโดยไม่ refresh, กดแล้วลดทันทีและพาไปหน้าถูก, logout แล้ว Network ไม่มี poll ต่อ, token หมดอายุแล้วเด้งไป login ครั้งเดียว, popover ไม่ล้นจอ 375px
4. สรุปว่าแต่ละส่วนทำอะไร แล้วหยุดรอ (ไม่ commit)
