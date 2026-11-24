# Plan: ai-summary-fe — ปุ่ม "สรุปด้วย AI" ในหน้าจัดการคำขอ

spec: `_specs/ai-summary-fe.md` · branch: `claude/feature/ai-summary-fe` · BE ที่ใช้: `POST /applications/:id/summary` (commit `27e2122`)

## Context
BE สรุปคำขอด้วย AI ได้แล้ว แต่เจ้าของโพสต์ยังไม่มีทางเรียกใช้จากหน้าเว็บ รอบนี้เพิ่มปุ่มสรุปรายใบในการ์ดคำขอ pending และปุ่ม "สรุปทั้งหมด" ระดับหน้า ให้เจ้าของอ่านสรุปประกอบการตัดสินใจ AI ไม่ตัดสินแทน

**ขอบเขต:** แตะเฉพาะ `web/` และเอกสาร (`_specs/`, `_plans/`) ไม่แตะ `api/` ไม่เขียนโค้ดเทสต์ (`web/` ไม่มี test runner) และไม่ commit

**ลำดับเมื่ออนุมัติแผน:** (1) อัปเดต spec ตามคำตอบ Open Questions (2) เซฟแผนนี้เป็น `_plans/ai-summary-fe.md` (3) **หยุดถามก่อนเริ่มเขียนโค้ด**

## คำตอบ Open Questions (จะเขียนลง spec)
1. ใบหนึ่งล้มเหลว → ทำใบถัดไปต่อ ยกเว้น 503 ให้หยุดทั้งชุด
2. ไม่ปิดปุ่มอนุมัติ/ปฏิเสธระหว่างสรุป เฉพาะปุ่มสรุป (ทั้งในการ์ดและ "สรุปทั้งหมด") ที่ disabled ตอน `actions.isBusy`
3. ไม่มีพับ/ซ่อนส่วนสรุป
4. ไม่แสดง `updated_at`

ใน spec จะย้ายคำตอบเหล่านี้ไปไว้ใน Functional Requirements / Acceptance Criteria ลบบล็อก "ตอบ Open Questions" ที่ต่อท้ายไว้ และให้หัวข้อ Open Questions เหลือ "ไม่มี"

## ข้อเท็จจริงที่ตรวจจากโค้ดแล้ว
- `getErrorMessage(err, { overrides })` ใน `web/src/lib/api/errors.ts` เช็ค `overrides` ตาม status **ก่อน** กฎ 502/504 → network จึงใช้ override แก้ความหมายได้โดยไม่ต้องแก้ตัวฟังก์ชัน
- `apiRequest` ใน `web/src/lib/api/client.ts` โยน `ApiError` (มี `statusCode`) หรือ `NetworkError`
- `queryClient` ตั้งค่า `mutations.retry: false` ไว้แล้ว จึงไม่ยิงซ้ำเอง (ไม่เสียโควตา AI)
- pattern ของ mutation: `web/src/features/owner/use-owner-actions.ts` ส่วน pattern การเขียน cache: `web/src/features/notifications/use-mark-read.ts` (`setQueryData`)
- `PetApplicationCard` รับ prop `disabled` (= `actions.isBusy`) อยู่แล้ว ใช้ซ้ำให้ปุ่มสรุปได้เลย
- ไอคอนที่ใช้อยู่แล้วในโปรเจกต์: `Loader2Icon` + `animate-spin`, `RotateCwIcon` · มี `components/ui/alert.tsx` (variant `destructive`)

## (ก) วิธีเขียนผลลง query cache
- query key ใหม่ใน `query-keys.ts`: `applications.summary(id)` → `['applications', 'summary', id]`
- mutation key ใหม่ (คงที่) `['applications', 'summarize']` ทุก mutation สรุปใช้ key เดียวกัน แยกใบด้วย `variables` (= application id)
- **เขียน:** `useMutation({ mutationKey, mutationFn: summarizeApplication, onSuccess: (data, id) => queryClient.setQueryData(queryKeys.applications.summary(id), data) })`
  - ใส่ `onSuccess` ไว้ที่ option ของ `useMutation` (ไม่ใช่ที่ `mutate(id, {...})`) เพราะ TanStack v5 เรียก callback ระดับ hook แม้ component จะ unmount แล้ว จึงยังได้เก็บผลที่ BE สรุปเสร็จ
- **อ่านผล (การ์ด + หน้า):** `useQuery({ queryKey: summary(id), queryFn: skipToken })` อ่านจาก cache อย่างเดียว ไม่ยิง request และ re-render เมื่อ `setQueryData`
- **อ่านสถานะโหลด/error ของการ์ด:** `useMutationState({ filters: { mutationKey, predicate: m => m.state.variables === id } })` เอารายการล่าสุด → การ์ดเห็นสถานะเดียวกัน ไม่ว่าจะเริ่มจากปุ่มในการ์ดหรือจาก "สรุปทั้งหมด"
- ไม่ invalidate อะไรเลย เพราะการสรุปไม่เปลี่ยนสถานะคำขอหรือสัตว์ (ตาม spec)
- ข้อจำกัดที่ยอมรับ: cache อยู่ในหน่วยความจำ โหลดหน้าใหม่แล้วสรุปหาย กดซ้ำได้ผลเดิมจาก BE ทันที

## (ข) กลไกหยุดลูป "สรุปทั้งหมด" ตอน unmount
- hook `useSummarizeAll` มี `abortRef = useRef<AbortController | null>(null)` และ `useEffect(() => () => abortRef.current?.abort(), [])` ตอน unmount จึง abort
- กดปุ่ม → สร้าง `AbortController` ใหม่เก็บใน ref แล้ววน id ด้วย `for ... of` + `await mutation.mutateAsync(id)` ทีละใบ (ไม่ยิงพร้อมกัน)
- เช็ค `signal.aborted` **ก่อนเริ่มแต่ละใบ** และ **หลัง await ทุกครั้งก่อน `setState`** ถ้า abort แล้วให้ `return` ทันที ไม่ยิงใบถัดไป และไม่ set progress
- request ที่กำลังวิ่งอยู่ตอน unmount **ไม่ยกเลิก** เพราะ BE เริ่มใช้โควตา AI แล้ว ปล่อยให้จบและเขียน cache ผ่าน `onSuccess` ระดับ hook (ข้อ ก) ถ้ากลับมาหน้านี้ใน session เดิมจะเห็นผลเลย
- ก่อนยิงแต่ละใบ เช็คซ้ำจากข้อมูลปัจจุบัน (ไม่ใช่ snapshot ตอนกด) ว่าควรข้ามไหม:
  - มีผลใน cache แล้ว → `queryClient.getQueryData(summary(id))`
  - การ์ดกำลังสรุปใบนั้นอยู่ → `queryClient.isMutating({ mutationKey, predicate })`
  - ไม่ใช่ pending แล้ว (เช่น อนุมัติใบอื่นระหว่างลูป) → สถานะใน `getQueryData(applications.byPet(petId))`
- error: `try/catch` รอบ `mutateAsync` ถ้าเป็น `ApiError` 503 ให้ `break` และ toast "บริการ AI ใช้ไม่ได้ชั่วคราว หยุดสรุปใบที่เหลือ" ส่วน error อื่นปล่อยผ่าน (การ์ดแสดง error เองจาก mutation state) แล้วทำใบถัดไป
- กันกดซ้อน: ปุ่ม disabled ระหว่างวิ่ง และ `run()` return ทันทีถ้ามีลูปวิ่งอยู่ (เช็คจาก ref)

## (ค) ไฟล์ที่จะสร้าง/แก้ทั้งหมด

**เอกสาร**
- แก้ `_specs/ai-summary-fe.md`: ใส่คำตอบ Open Questions ตามข้างบน
- สร้าง `_plans/ai-summary-fe.md`: สำเนาแผนนี้

**`web/src/lib/`**
- แก้ `types.ts`: `AiSummary { overview: string; highlights: string[]; concerns: string[] }`, `ApplicationSummaryResult { summary: AiSummary; updated_at: string }`
- แก้ `api/endpoints.ts`: `summarizeApplication(id)` → `apiRequest<ApplicationSummaryResult>(…/summary, { method: 'POST' })` วางในส่วน owner ถัดจาก `rejectApplication`
- แก้ `api/errors.ts`: `getSummaryErrorMessage(err)` = `getErrorMessage(err, { overrides })` ข้อความ:
  - 403 "คุณไม่ใช่เจ้าของโพสต์นี้ จึงขอสรุปไม่ได้"
  - 404 "ไม่พบคำขอนี้"
  - 409 "คำขอนี้ถูกตัดสินไปแล้ว จึงสรุปไม่ได้"
  - 502 "AI ตอบกลับในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่"
  - 503 "บริการ AI ใช้ไม่ได้ชั่วคราว กรุณาลองใหม่ภายหลัง"
  - 504 "AI ใช้เวลานานเกินไป กรุณาลองใหม่"
- แก้ `query/query-keys.ts`: `applications.summary(id)` และ `applications.summarize` (mutation key)

**`web/src/features/owner/`**
- สร้าง `use-application-summary.ts`:
  - `useSummarizeMutation()` (useMutation + `setQueryData` ตาม ก)
  - `useApplicationSummary(id)` → `{ summary, isLoading, error, summarize }` (อ่าน cache + mutation state ตาม ก)
- สร้าง `use-summarize-all.ts`: `useSummarizeAll(petId, pendingIds)` → `{ run, isRunning, progress: { current, total } | null, remainingCount }`
  - `remainingCount` นับจาก `useQueries` + `skipToken` ของแต่ละ id (เป็น reactive) ใช้ตัดสินว่าจะโชว์ปุ่มไหม
- สร้าง `ApplicationSummary.tsx` (props: `applicationId`, `disabled`) แสดง 4 สถานะ:
  - ยังไม่กด: `Button variant="outline" size="sm"` + `SparklesIcon` "สรุปด้วย AI"
  - โหลด: ปุ่ม disabled + `Loader2Icon animate-spin` "กำลังสรุป…"
  - สำเร็จ: กล่องพื้นจาง หัว "สรุปโดย AI" → overview, "จุดเด่น" (ซ่อนถ้าว่าง), "ข้อควรพิจารณา" (ซ่อนถ้าว่าง), บรรทัดเล็ก "สรุปโดย AI ใช้ประกอบการพิจารณาเท่านั้น" · ข้อความ `break-words`
  - ล้มเหลว: `Alert variant="destructive"` + `getSummaryErrorMessage` + ปุ่ม "ลองใหม่" (`RotateCwIcon`)
  - ครอบด้วย `aria-live="polite"` ให้ screen reader รู้ว่าผลมาแล้ว
- แก้ `PetApplicationCard.tsx`: ใส่ `<ApplicationSummary applicationId={application.id} disabled={disabled} />` ในบล็อก `isPending` ระหว่าง `<dl>` คำตอบ กับแถวปุ่มอนุมัติ/ปฏิเสธ ไม่เพิ่ม prop ใหม่

**`web/src/pages/`**
- แก้ `ManagePetPage.tsx`:
  - `useSummarizeAll(petId, pendingIds)` (`pendingIds` จาก `applications` ที่เรียง pending ก่อนแล้ว จึงตรงกับลำดับที่แสดง)
  - ในหัว "คำขอรับเลี้ยง" ข้าง "รอพิจารณา N รายการ" ใส่ปุ่ม "สรุปทั้งหมด" (`SparklesIcon`) โชว์เมื่อ `remainingCount > 0` หรือกำลังวิ่ง · disabled เมื่อ `isRunning || actions.isBusy` · ระหว่างวิ่ง label "กำลังสรุป {current}/{total}"
  - hook ต้องเรียกก่อน early return ทุกจุด (กฎของ hooks) เหมือน `useOwnerActions`

**ไม่แตะ:** `api/` ทั้งหมด, `docs/roadmap.md` (ติ๊กหลังผู้พัฒนาตรวจแล้ว)

## Verification
1. `cd web && npm run build && npm run lint` ผ่าน
2. `git diff --stat -- api/` ว่าง
3. ทดสอบด้วยมือ (`npm run dev` ทั้ง api และ web, login เป็นเจ้าของที่มีคำขอ pending ≥ 3 ใบ) ตาม Testing Guidelines ใน spec:
   - การ์ด pending มีปุ่ม การ์ดที่ตัดสินแล้วไม่มี
   - กดสรุป → โหลด → แสดงผล + ข้อความกำกับ หัวข้อที่ว่างถูกซ่อน
   - "สรุปทั้งหมด" หลังสรุปไปแล้ว 1 ใบ → Network tab มี request เพิ่ม 2 ตัว เรียงต่อกันไม่ซ้อน และ label นับถูก
   - ตั้ง `AI_MODEL` ในเครื่องตัวเองให้ผิด → การ์ดแสดงข้อความไทย (503/502) + "ลองใหม่" ใช้ได้ · ถ้าได้ 503 ระหว่าง "สรุปทั้งหมด" ต้องหยุดชุดพร้อม toast
   - 409: สองแท็บ ปฏิเสธในแท็บหนึ่ง แล้วกดสรุปอีกแท็บ
   - กด "สรุปทั้งหมด" แล้วกดกลับไป "สัตว์ของฉัน" ทันที → ไม่มี request ใบถัดไปใน Network tab และไม่มี warning ใน console
   - หน้าจอมือถือ (DevTools 375px): ส่วนสรุปไม่ล้นการ์ด
