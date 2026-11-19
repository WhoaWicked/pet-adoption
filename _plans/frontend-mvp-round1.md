# Plan: frontend-mvp — รอบที่ 1 (scaffold → api client → auth → layout → รายการสัตว์)

spec: `_specs/frontend-mvp.md` · branch: `claude/feature/frontend-mvp` (อยู่แล้ว) · roadmap ข้อ 9 (🤖 AI เขียนได้ทั้งหมดใน `web/`)

## Context
`web/` ยังว่างเปล่า รอบนี้วางฐานของ frontend ทั้งหมดที่หน้าอื่นจะใช้ร่วมกัน (โครงโปรเจกต์, design token, api client, error ภาษาไทย, auth, layout) และทำหน้าแรกที่ดูได้จริง 3 หน้า: Login, Register, รายการสัตว์ จบรอบแล้วหยุดรอผู้พัฒนา

**ขอบเขต:** แตะเฉพาะ `web/` ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ ไม่ commit (รอผู้พัฒนาสั่ง) ไม่มีขั้นไหนต้องหยุดถามเรื่องส่วนต้องห้าม

## ข้อเท็จจริงที่ตรวจแล้ว
- API ฟังที่ `PORT=3000` (`api/.env.example`), ไม่มี global prefix, ไม่เปิด CORS → proxy `/api/*` → `http://localhost:3000/*` (ตัด `/api`)
- Error filter (`api/src/common/filters/all-exceptions.filter.ts`): `{ statusCode, error, message, details? }`, `details` = `string[]` ของ class-validator (เช่น `"email must be an email"` — ขึ้นต้นด้วยชื่อ field → จับคู่ field ได้), email ซ้ำตอน register มาจาก pg 23505 → 409 `"Resource already exists"`
- `POST /auth/login` → `{ accessToken }`, `/auth/me` → `{ id }`, `GET /pets` → `{ data, meta }` เฉพาะ available, `limit` สูงสุด 50
- Node 25.2 / npm 11.6 · เวอร์ชันล่าสุดจาก `npm view`: vite 8.3, react 19.3, react-router 8.5, @tanstack/react-query 5.108, tailwindcss 4.3 (+ `@tailwindcss/vite`), shadcn CLI 4.23
- **ไม่มี** skill `frontend-design` และ Context7 MCP ในเซสชันนี้ → ออกแบบตามโทนใน spec เอง และยืนยันวิธี setup ของ Tailwind v4 / shadcn / react-router จากไฟล์ที่ CLI สร้างจริง + README ใน `node_modules` หลังติดตั้ง

## การตัดสินใจหลัก
| เรื่อง | เลือก | เหตุผล |
|---|---|---|
| scaffold | `npm create vite@latest web -- --template react-ts` แล้วเพิ่มเอง | โครงมาตรฐาน, อธิบายง่ายในสัมภาษณ์ |
| styling | Tailwind v4 ผ่าน `@tailwindcss/vite` + `shadcn init` (non-interactive) แล้ว `shadcn add` เฉพาะที่ใช้: button, card, badge, input, label, select, skeleton, sonner, sheet, alert | ตาม spec; ไม่เขียน CSS เองนอกจาก token |
| router | `react-router` (data router `createBrowserRouter`) | nested layout + protected route ชัด |
| server state | TanStack Query; auth/UI state ใช้ context | ตาม spec |
| font | `@fontsource-variable/noto-sans-thai` (self-host) | ครอบทั้งไทย/ละติน ไม่ต้องพึ่ง Google Fonts |
| token | เก็บใน `localStorage` (key เดียว) | ตาม spec |
| ส่ง 401 ไปหา auth | client มี `setUnauthorizedHandler()` ให้ AuthProvider ลงทะเบียน | กัน import วน (client ↔ context) |
| pagination | URL `?species=&province=&page=` (page เริ่ม 1), `PAGE_SIZE = 12` | แชร์ลิงก์ได้, 12 หารด้วย 2/3/4 คอลัมน์ลงตัว |
| เส้นทางที่ยังไม่ทำ | ลงทะเบียน route `/pets/:id`, `/pets/new`, `/my-applications`, `/saved`, `/my-pets` ชี้ไปหน้า placeholder "กำลังพัฒนา" (ที่ต้อง login ครอบด้วย RequireAuth) | ลิงก์ใน header/การ์ดไม่พาไป 404 และทดสอบ protected route ได้; ไม่ใช่การทำหน้าจริง |

## ขั้นตอน

### 1. Scaffold `web/`
- create-vite (react-ts) → ติดตั้ง `react-router @tanstack/react-query @fontsource-variable/noto-sans-thai` และ dev `tailwindcss @tailwindcss/vite`
- `tsconfig.json` / `tsconfig.app.json`: alias `@/*` → `src/*` (shadcn ต้องใช้)
- `vite.config.ts`: plugin react + tailwind, alias `@`, `server.proxy['/api']` → target จาก env `VITE_API_PROXY_TARGET` (default `http://localhost:3000`, อ่านด้วย `loadEnv`) + `rewrite` ตัด `/api`
- `shadcn init` → ได้ `components.json`, `src/lib/utils.ts` (`cn`), แล้ว `shadcn add` component ตามตาราง
- `web/.env.example`: `VITE_API_BASE_URL=/api`, `VITE_API_PROXY_TARGET=http://localhost:3000` (ไม่มี secret) · `.gitignore` มี `.env` ไว้
- ลบไฟล์ตัวอย่างของ Vite (logo, App.css, counter)

### 2. Design token — `web/src/index.css`
- `:root` เป็นชุดเดียว: `--background` ขาวนวล (cream), `--foreground` น้ำตาลเข้ม, `--primary` ส้มอิฐอุ่น (terracotta) + `--primary-foreground`, `--muted`, `--border`, `--ring`, `--destructive`, `--radius` (~0.875rem), และ token ป้ายสถานะ `--status-available/adopted/closed` (+ `-foreground`) ที่จางกว่า primary
- `@theme inline` map token เข้ากับ utility ของ Tailwind (รวม `--font-sans: 'Noto Sans Thai Variable'`) — ไม่มีสี hard-code ใน component
- ไม่ทำ dark mode (ลบ `.dark` block ที่ shadcn ใส่มา)

### 3. ค่าคงที่และ util — `web/src/lib/`
- `constants/provinces.ts` — 77 จังหวัด (สะกดตามทางการ, `as const`) + `isProvince()`
- `constants/labels.ts` — label ไทยของ species, pet status, application status, housingType (+ ตัวช่วยตรวจ enum เช่น `isSpecies()`)
- `format.ts` — `formatAge(ageMonths)` → "2 ปี 3 เดือน" / "5 เดือน" / "น้อยกว่า 1 เดือน"
- `types.ts` — `Pet`, `Paged<T>`, `LoginResponse`, `Me` (snake_case ตาม response จริง)

### 4. api client — `web/src/lib/api/`
- `client.ts`
  - `ApiError` (`statusCode`, `error`, `message`, `details?`) + `NetworkError` (fetch reject)
  - `apiRequest<T>(path, { method, query, body, auth = true, on401 = 'redirect' | 'silent' | 'ignore' })`: base URL จาก `import.meta.env.VITE_API_BASE_URL ?? '/api'`, `buildQuery()` ตัด `undefined/null/''`, ใส่ `Content-Type` เมื่อมี body, ใส่ Bearer เมื่อมี token, body ว่าง/204 → `undefined`, error body ที่ parse ไม่ได้ → `ApiError` ทั่วไปตาม status
  - 401 + มี token ถูกส่งไป: `on401='redirect'` เรียก handler ที่ลงทะเบียนไว้, `'silent'` แค่เคลียร์ token (ใช้ตอนเช็ค `/auth/me` ตอนเปิดเว็บ), `'ignore'` ไม่ทำอะไร (ใช้กับ login)
- `errors.ts`
  - `getErrorMessage(err)` → ข้อความไทย: network → "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"; 409 แยกตาม `message` ที่รู้จัก (ยื่นซ้ำ, สัตว์ไม่ available, ไม่ใช่ pending, adopted แล้ว, `Resource already exists` → "อีเมลนี้ถูกใช้แล้ว" ในบริบท register ผ่าน override); 403/404; 400 ที่มาจาก UUID ผิด → "ไม่พบข้อมูล"; 401 login → "อีเมลหรือรหัสผ่านไม่ถูกต้อง"; อื่น ๆ → `message` จาก API หรือข้อความทั่วไป
  - `getFieldErrors(err, fields)` → map `details[]` เป็น `{ field: ข้อความไทย }` จากคำนำหน้า (camelCase) ที่เหลือคืนเป็น `formError`
- `endpoints.ts` — ฟังก์ชันเรียก API ของรอบนี้: `login`, `register`, `getMe`, `listPets(filter)` (body ส่งแค่ field ตาม DTO)

### 5. TanStack Query — `web/src/lib/query/`
- `query-client.ts`: queries `retry: (count, err) => count < 1 && !(err is ApiError && [400, 401, 403, 404, 409] มี status)` (400 เพิ่มเพราะ validation ไม่มีทางผ่านเมื่อ retry), `refetchOnWindowFocus: false`; mutations `retry: false`
- `query-keys.ts` — ศูนย์กลางไฟล์เดียว: `auth.me`, `pets.all`, `pets.list(filter)`, `pets.detail(id)`, `pets.saved`, `pets.mine`, `applications.mine(page)`, `applications.byPet(petId)`, `notifications.list`, `notifications.unreadCount` (ใส่ไว้ล่วงหน้าเพื่อให้รอบถัดไปใช้ต่อ แต่รอบนี้ใช้จริงแค่ `auth.me`, `pets.list`)

### 6. Auth — `web/src/features/auth/`
- `token-storage.ts` — get/set/clear (try/catch รอบ localStorage)
- `AuthProvider.tsx` + `useAuth()`
  - state: `status: 'checking' | 'authenticated' | 'anonymous'`, `userId`
  - เปิดเว็บมี token → `useQuery(auth.me)` ด้วย `on401: 'silent'` → ได้ → authenticated, 401 → เคลียร์ token เงียบ ๆ → anonymous
  - `login(email, password)` (mutation, `on401: 'ignore'`) → เก็บ token → fetch me → authenticated
  - `logout()` → เคลียร์ token + `queryClient.clear()`
  - ลงทะเบียน unauthorized handler: logout แล้ว `navigate('/login?redirect=<path ปัจจุบัน>')` มี flag กันเด้งซ้ำเมื่อหลาย request ได้ 401 พร้อมกัน
- `RequireAuth.tsx` — `checking` → loading, `anonymous` → `<Navigate to="/login?redirect=...">`, ไม่งั้นแสดง `<Outlet/>`
- `redirect.ts` — `safeRedirect(param)` รับเฉพาะ path ที่ขึ้นด้วย `/` และไม่ใช่ `//` (กัน open redirect), default `/`

### 7. หน้า Login / Register — `web/src/pages/`
- `LoginPage.tsx` — Card กลางจอ, email + password, ตรวจฝั่ง client, error ไทยแสดงใน Alert, ปุ่ม disable + ข้อความ "กำลังเข้าสู่ระบบ…" ระหว่างรอ, สำเร็จ → `safeRedirect`, ลิงก์ไป Register (พก `redirect` ต่อ), ถ้า login อยู่แล้วเด้งออก
- `RegisterPage.tsx` — displayName, email, password (≥ 8, แสดง hint), field error ใต้ช่อง (จาก client และ `details`), 409 → "อีเมลนี้ถูกใช้แล้ว", สำเร็จ → `login()` อัตโนมัติด้วยค่าเดิม → `safeRedirect`; ถ้า auto-login ล้ม → ไปหน้า login พร้อมข้อความ "สมัครสำเร็จ กรุณาเข้าสู่ระบบ"

### 8. Layout + header — `web/src/components/layout/`
- `AppLayout.tsx` — Header + `<main>` (container กว้างสุด ~6xl, padding ข้าง 16px บนมือถือ) + `<Outlet/>` + `<Toaster/>` (sonner)
- `Header.tsx` — ชื่อเว็บ + ไอคอนอุ้งเท้า (lucide), ลิงก์ `NavLink`: หน้าแรก, ลงประกาศ (ปุ่ม primary), คำขอของฉัน, ที่บันทึกไว้, สัตว์ของฉัน; ขวาสุด: ปุ่ม เข้าสู่ระบบ/สมัคร หรือ ออกจากระบบ; ลิงก์ที่ต้อง login ซ่อนเมื่อยังไม่ login (ยกเว้น "ลงประกาศ" ที่พาไป login); มือถือ (< md) ยุบเป็นปุ่มเมนูเปิด `Sheet`; ยังไม่มีกระดิ่ง (เว้นตำแหน่งไว้)
- `components/common/` — `LoadingState` (Skeleton), `EmptyState` (ไอคอน + ข้อความ + action), `ErrorState` (ข้อความไทย + ปุ่ม "ลองใหม่" เรียก `refetch`), `ComingSoonPage`, `NotFoundPage`
- `router.tsx` — `createBrowserRouter`: layout → `/` (PetsList), `/login`, `/register`, `/pets/:id` (placeholder), กลุ่ม RequireAuth: `/pets/new`, `/my-applications`, `/saved`, `/my-pets`, `/my-pets/:petId` (placeholder), `*` → NotFound
- `main.tsx` — `QueryClientProvider` → `RouterProvider`; `AuthProvider` อยู่ใน root route element (ต้องใช้ `useNavigate`)

### 9. หน้ารายการสัตว์ — `web/src/features/pets/` + `pages/PetsListPage.tsx`
- `usePetFilters()` — อ่าน/เขียน `useSearchParams`: sanitize (species ไม่อยู่ใน enum → ไม่ใช้, province ไม่อยู่ใน 77 → ไม่ใช้, page ไม่ใช่จำนวนเต็ม ≥ 1 → 1), `setFilter` ลบ key เมื่อเลือก "ทั้งหมด" และรีเซ็ต page, `setPage`
- `usePetsList(filter)` — `useQuery(queryKeys.pets.list(filter))` → `listPets({ species, province, limit: 12, offset })`, `placeholderData: keepPreviousData` (เปลี่ยนหน้าไม่กระพริบ)
- `PetFilters.tsx` — shadcn `Select` 2 ตัว (ใช้ค่า sentinel `"all"` เพราะ Select ห้ามค่า `""`), ปุ่ม "ล้างตัวกรอง" เมื่อมี filter
- `PetCard.tsx` — Card + รูปอัตราส่วน 4:3 `object-cover` (`loading="lazy"`, `onError` → placeholder), placeholder = พื้น muted + ไอคอนอุ้งเท้า/ชนิดสัตว์, ชื่อ (truncate), จังหวัด (ไอคอน MapPin), อายุ, `PetStatusBadge`; ทั้งการ์ดเป็นลิงก์ไป `/pets/:id` — ใช้ซ้ำในหน้า saved / my-pets รอบหน้า
- `PetStatusBadge.tsx` — Badge สีจาก token สถานะ + label ไทย
- `Pagination.tsx` — ก่อนหน้า / "หน้า x จาก y" / ถัดไป (disable ที่ขอบ), ซ่อนเมื่อมีหน้าเดียว, เลื่อนขึ้นบนเมื่อเปลี่ยนหน้า
- state: loading → grid ของ skeleton การ์ด; error → ErrorState; ว่างและไม่มี filter → "ยังไม่มีสัตว์รอบ้าน" + ปุ่มลงประกาศ; ว่างเพราะ filter → "ไม่พบสัตว์ตามตัวกรอง" + ล้างตัวกรอง; page เกิน → "ไม่มีหน้านี้" + กลับหน้าแรก
- grid: 1 คอลัมน์ (มือถือ) / 2 (sm) / 3 (lg), แสดงจำนวนทั้งหมดจาก `meta.total`

## ไฟล์หลักที่จะสร้าง
`web/vite.config.ts`, `web/components.json`, `web/.env.example`, `web/src/index.css`, `web/src/main.tsx`, `web/src/router.tsx`, `web/src/lib/api/{client,errors,endpoints}.ts`, `web/src/lib/query/{query-client,query-keys}.ts`, `web/src/lib/constants/{provinces,labels}.ts`, `web/src/features/auth/*`, `web/src/features/pets/*`, `web/src/components/layout/*`, `web/src/components/common/*`, `web/src/pages/{Login,Register,PetsList}Page.tsx`, `web/src/components/ui/*` (สร้างโดย shadcn)

## Verification
1. `cd web && npm run build` (tsc + vite build) ผ่านไม่มี error และ `npm run lint` ผ่าน
2. `grep` ใน `web/src` ไม่มีสี hex/rgb hard-code นอก `index.css` และไม่มีไฟล์ใน `api/` ถูกแก้ (`git status` เห็นแค่ `web/`)
3. รัน API (`api` → `npm run start:dev`, ต้องมี DB) + `web` → `npm run dev` แล้วตรวจด้วยมือ (หรือผ่าน Chrome ถ้าผู้พัฒนาอนุญาต):
   - `/api/health` ผ่าน proxy ตอบ 200
   - Register ผู้ใช้ใหม่ → auto-login → กลับหน้าแรก, header เปลี่ยนเป็นปุ่มออกจากระบบ; register email ซ้ำ → "อีเมลนี้ถูกใช้แล้ว"; password 7 ตัว → ถูกกันฝั่ง client
   - Login ผิด → "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ไม่ redirect วน
   - เข้า `/saved` ตอนยังไม่ login → ไป `/login?redirect=/saved` → login แล้วกลับ `/saved`
   - แก้ token ใน localStorage ให้เสีย แล้ว refresh หน้าแรก → เคลียร์เงียบ ๆ ไม่เด้ง; อยู่หน้า protected แล้ว token เสีย → ไป login
   - รายการสัตว์: เลือก species/province → URL เปลี่ยน, Network tab ไม่มี param ค่าว่าง, เลือก "ทั้งหมด" → param หายไป, เปลี่ยนหน้า → `offset` ถูกต้อง, refresh แล้ว filter/หน้าเดิมคงอยู่, `?page=999` → empty state, `?species=bird` → ถูกเมิน
   - ปิด API → หน้ารายการแสดง ErrorState "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" + ลองใหม่ (retry แค่ 1 ครั้ง)
   - DevTools ความกว้าง 375px: ไม่มี horizontal scroll, เมนูยุบเป็น Sheet
4. สรุปให้ผู้พัฒนา: อธิบายสั้น ๆ ว่าแต่ละไฟล์/ส่วนทำอะไร แล้วหยุดรอ (ไม่ commit)
