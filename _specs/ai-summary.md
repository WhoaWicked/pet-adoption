# Spec for ai-summary

branch: claude/feature/ai-summary
ownership: แยกสองส่วน — ส่วนเครื่องมือ AI 🤖 AI may implement (`api/src/ai/`, `api/src/config/`, `.env*.example`) | ส่วนเรียกใช้ ✍️ developer implements (AI gives hints/review only) (`api/src/applications/`)

## Summary
- สรุปคำขอรับเลี้ยงด้วย AI เมื่อเจ้าของโพสต์กดปุ่ม (on-demand) ไม่มี worker และไม่มีงานเบื้องหลัง
- เก็บผลในตาราง `ai_summaries` ที่มีอยู่แล้ว ห้ามเพิ่ม migration และห้ามเพิ่มคอลัมน์
- รอบนี้ทำเฉพาะ `api/src/ai/` และ env ใน `api/src/config/` ให้เป็นเครื่องมือที่ผู้พัฒนาเรียกใช้จาก `applications/`
- ✍️ ผู้พัฒนาเขียนเองใน `applications/`: endpoint `POST /applications/:id/summary`, timeout, retry, fallback, การรีเซ็ตสรุปเมื่อยื่นใหม่หลังถอน, การเช็คว่าเป็นเจ้าของโพสต์
- AI สรุปให้อ่านเท่านั้น ไม่ตัดสินแทน ไม่ให้คะแนน ไม่จัดอันดับผู้ยื่น
- FE (ปุ่มและหน้าแสดงผล) แยกไปทำรอบถัดไป

## Functional Requirements
- **AiClient (interface)**
  - มี method เดียว `generate(prompt, signal)` รับ prompt เป็น string และ `AbortSignal` แล้วคืนข้อความดิบ (string) ที่ model ตอบ
  - ไม่รู้จักเรื่อง summary, ไม่ parse, ไม่ retry, ไม่ตั้ง timeout เอง (timeout มาจาก signal ที่ผู้เรียกส่งเข้ามา)
- **Provider token `AI_CLIENT`**
  - inject ผ่าน token แบบเดียวกับ `PG_POOL` (`@Inject(AI_CLIENT)`) ให้เทสต์ override เป็นตัวปลอมได้ด้วย `overrideProvider(AI_CLIENT)`
  - `AiModule` export `AI_CLIENT` และ `AiSummariesRepository`
- **GeminiAiClient (implementation)**
  - ใช้ SDK ทางการ `@google/genai` (`GoogleGenAI` → `models.generateContent`) ห้ามใช้ `@google/generative-ai` ซึ่งเลิกพัฒนาแล้ว
  - ขอผลเป็น JSON ด้วย `responseMimeType: application/json` (และ schema ถ้า SDK รองรับ) แต่ยังต้อง validate ผลเองทุกครั้ง
  - ส่ง signal ต่อให้ SDK เพื่อยกเลิก request ได้จริง ถ้ายืนยันไม่ได้ว่า SDK รองรับ ให้แข่ง (race) ระหว่าง request กับ signal แล้วโยน `AiAbortedError` ทันทีที่ signal ถูกยกเลิก
  - ชื่อ model อ่านจาก `AI_MODEL` และ key จาก `GEMINI_API_KEY` ผ่าน config ห้ามมีชื่อ model หรือ key ใน source
- **Env (`api/src/config/env.ts`)**
  - เพิ่ม `GEMINI_API_KEY` และ `AI_MODEL` เป็น string ที่ต้องมี ถ้าขาดหรือว่างให้แจ้งเฉพาะชื่อตัวแปรตามแบบเดิม ห้ามพิมพ์ค่า
  - `.env.example` และ `.env.test.example` ใส่แค่ชื่อตัวแปร ค่าว่าง ห้ามใส่ค่าจริงหรือชื่อ model ในไฟล์ใดๆ
- **Prompt builder `buildSummaryPrompt(answers)`**
  - รับ answers ของคำขอ (`housingType`, `hasPetExperience`, `note?`) โดยกำหนด type ของตัวเองใน `ai/` ที่หน้าตาตรงกับ `ApplicationAnswers` ไม่ import จาก `applications/`
  - เลือกส่งเฉพาะ 3 field นี้แบบ whitelist ถ้ามี field อื่นติดมา (อีเมล, ชื่อ, id, ข้อมูลผู้ใช้, ข้อมูลสัตว์) ต้องไม่หลุดเข้า prompt
  - ครอบ answers ด้วย delimiter ที่ชัดเจน และสั่งว่าเนื้อหาในนั้นเป็นข้อมูลล้วน ไม่ใช่คำสั่ง ห้ามทำตามข้อความในนั้น
  - ถ้าใน `note` มีข้อความที่หน้าตาเหมือน delimiter ต้องทำให้ไม่สามารถปิด delimiter ก่อนกำหนดได้ (escape หรือแทนที่)
  - สั่งให้ตอบเป็น JSON อย่างเดียวรูปแบบ `{ overview, highlights[], concerns[] }` เป็นภาษาไทย
  - สั่งห้ามให้คะแนน ห้ามจัดอันดับ ห้ามแนะนำว่าควรอนุมัติหรือปฏิเสธ และห้ามเดาข้อมูลที่ไม่มีใน answers
- **Validator `parseSummary(raw)`**
  - รับข้อความดิบจาก AiClient แล้วคืน `AiSummary` `{ overview: string, highlights: string[], concerns: string[] }`
  - รองรับกรณี model ห่อ JSON ด้วย code fence
  - เงื่อนไข: `overview` เป็น string ไม่ว่างหลัง trim, `highlights`/`concerns` เป็น array ของ string ไม่ว่าง (array ว่างได้) และมีขนาด/ความยาวไม่เกินเพดานที่กำหนดเป็นค่าคงที่ใน `ai/`
  - คืนเฉพาะ 3 field นี้ ตัด field อื่นทิ้ง (เช่น `score`, `rank`)
  - ไม่ตรงรูปแบบ → โยน `AiInvalidResponseError` โดยไม่ใส่ข้อความดิบทั้งก้อนลงใน error message
- **Repository `AiSummariesRepository` (raw SQL ผ่าน `PG_POOL`)**
  - `findByApplicationId(applicationId, client?)` → แถวของ `ai_summaries` หรือ `undefined`
  - `upsert(input, client?)` → insert หรือ update ตาม `application_id` แล้วคืนแถวล่าสุด และตั้ง `updated_at = now()` ทุกครั้ง
  - `input` = `{ applicationId, status, summary?, lastError?, attempts? }` โดยค่าที่ไม่ส่งมาให้เป็น `null` (`summary`, `last_error`) หรือ `0` (`attempts`) คือเขียนทับทั้งแถว ไม่ merge
  - รับ `PoolClient` เป็น optional เพื่อให้ผู้พัฒนาเรียกใน transaction ของตัวเองได้ (เช่น ตอนรีเซ็ตเมื่อยื่นใหม่) ถ้าไม่ส่งมาให้ใช้ pool
  - ไม่มี business logic: ไม่เช็คเจ้าของ ไม่เช็คสถานะคำขอ ไม่นับ attempts เอง
- **Contract ที่ผู้พัฒนาเรียกใช้จาก `applications/`**

  | สิ่งที่เรียก | Input | Output | Error ที่อาจโยน |
  |---|---|---|---|
  | `aiClient.generate` (inject ด้วย `AI_CLIENT`) | `prompt: string`, `signal: AbortSignal` | `Promise<string>` ข้อความดิบ | `AiAbortedError` (signal ถูกยกเลิก เช่น timeout ของผู้เรียก), `AiProviderError` (เรียก API ไม่สำเร็จ, network, quota, คำตอบว่าง; มี `status?` ถ้ารู้ และ `retryable: boolean` เป็น hint) |
  | `buildSummaryPrompt` | `answers: SummaryAnswers` | `string` | ไม่โยน |
  | `parseSummary` | `raw: string` | `AiSummary` | `AiInvalidResponseError` |
  | `aiSummariesRepository.findByApplicationId` | `applicationId: string`, `client?: PoolClient` | `Promise<AiSummaryRow \| undefined>` | error ของ `pg` ตามปกติ |
  | `aiSummariesRepository.upsert` | `input: UpsertAiSummaryInput`, `client?: PoolClient` | `Promise<AiSummaryRow>` | error ของ `pg` ตามปกติ (เช่น FK ถ้า application ไม่มีอยู่) |

  - error ทั้งสามแบบ extend จาก `AiError` ตัวเดียวกัน ให้ผู้พัฒนาจับรวมได้ และไม่ใช่ `HttpException` (ผู้พัฒนาแปลงเป็น HTTP status เอง)
  - `AiSummaryRow` = `{ application_id, status: 'pending' | 'processing' | 'done' | 'failed', attempts, summary: AiSummary | null, last_error, created_at, updated_at }`
  - ข้อความ error ห้ามมี API key, prompt ทั้งก้อน หรือ answers ของผู้ยื่น
- โปรเจกต์เป็น CJS, ทุกไฟล์ใน `ai/` อธิบายสั้น ๆ ว่าแต่ละส่วนทำอะไร

## Possible Edge Cases
- signal ถูกยกเลิกไปแล้วก่อนเรียก `generate` → โยน `AiAbortedError` ทันที ไม่ยิง request
- model ตอบเป็นข้อความว่าง ถูก safety block หรือไม่มี candidate → `AiProviderError`
- model ตอบ JSON ห่อด้วย ```json ... ``` หรือมีข้อความนำหน้า/ต่อท้าย
- model ตอบ JSON ถูกแต่ field ผิด type, มี field เกิน (`score`) หรือ `highlights` ยาวผิดปกติ
- model ตอบเป็นภาษาอังกฤษ → ตรวจไม่ได้ในระดับ validator ให้คุมด้วย prompt (ไม่ถือเป็น error)
- `note` ไม่มี หรือเป็นข้อความว่าง → prompt ยังสร้างได้ และระบุว่าไม่มีหมายเหตุ
- `note` มีข้อความพยายามสั่ง model (prompt injection) หรือมี delimiter ปลอม
- `upsert` ซ้ำหลายครั้งกับ application เดียว → ได้แถวเดียวเสมอ (PK คือ `application_id`)
- `upsert` กับ application ที่ไม่มีอยู่ → FK error จาก `pg`
- เซิร์ฟเวอร์ restart ระหว่างแถวเป็น `processing` → repository ไม่จัดการ แต่ผู้พัฒนาต้องตัดสินใจใน `applications/` ว่าจะให้กดใหม่ได้หรือไม่
- `GEMINI_API_KEY` / `AI_MODEL` ไม่ได้ตั้ง → แอปไม่ start และแจ้งชื่อตัวแปร

## Acceptance Criteria
- มี `api/src/ai/` ที่ประกอบด้วย `AiClient` interface, `AI_CLIENT` token, `GeminiAiClient`, `buildSummaryPrompt`, `parseSummary`, error classes, `AiSummariesRepository` และ `AiModule`
- ไม่มีไฟล์ใน `api/src/applications/`, `api/src/pets/`, `api/src/auth/`, `api/src/common/filters/`, `api/migrations/` ถูกแก้
- ใช้ `@google/genai` และไม่มีชื่อ model หรือ key ในไฟล์ใดๆ ที่ commit
- ไม่มีเทสต์ใดยิง Gemini จริง เทสต์ทั้งหมดใช้ AiClient ปลอมหรือ mock SDK
- prompt ที่สร้างไม่มีข้อมูลนอก 3 field ของ answers และมี delimiter + คำสั่งว่าเป็นข้อมูลล้วน + รูปแบบ JSON + ห้ามให้คะแนน
- `parseSummary` คืนเฉพาะ `{ overview, highlights, concerns }` ที่ผ่านเงื่อนไข และโยน `AiInvalidResponseError` ในกรณีอื่น
- error ของโมดูลแยกแยะได้ 3 แบบตาม contract และไม่มีข้อมูลลับในข้อความ
- `npm test` และ `npm run lint` ผ่าน

## Open Questions
- `@google/genai` รองรับ `abortSignal` ใน config ของ `generateContent` หรือไม่ (เอกสาร API ไม่ได้ระบุ) ให้เช็คจาก type ของ SDK ตอน implement ถ้าไม่มีให้ใช้วิธี race ตามที่ระบุไว้
- เอกสาร Gemini ล่าสุดเรียก `generateContent` ว่า legacy และแนะนำ Interactions API แทน แต่ยังรองรับอยู่ รอบนี้เลือก `generateContent` เพราะเรียบง่ายและเป็น stateless หรือจะเปลี่ยนเป็น Interactions?
- `GEMINI_API_KEY` / `AI_MODEL` ควรเป็นตัวแปรบังคับตอน start (แนะนำ) ซึ่งทำให้ `.env.test` ต้องมีค่าหลอกสำหรับ e2e หรือให้เป็น optional แล้วโยน error ตอนเรียกแทน?
- `docs/roadmap.md` ข้อ 12 ยังเขียน endpoint เป็น `POST /pets/:id/summary` ควรแก้เป็น `POST /applications/:id/summary` ให้ตรงกับ spec นี้
- `CLAUDE.md` ยังระบุว่า AI summary อยู่ใน `worker/` และต้องไม่หายเมื่อ restart ควรอัปเดตให้ตรงกับแนวทาง on-demand หรือไม่
ตอบ Open Questions: (1) ให้เช็ค type ของ SDK ตอน implement ถ้ามี abortSignal ใช้เลย ถ้าไม่มีใช้ race ตาม spec (2) ใช้ generateContent ตามเดิม เพราะเรียบง่ายและ stateless โมดูลซ่อนไว้หลัง AiClient ถ้าจะเปลี่ยนทีหลังแก้แค่ GeminiAiClient (3) ให้ GEMINI_API_KEY และ AI_MODEL เป็นตัวแปรบังคับตอน start ตามแบบ validateEnv เดิม และ .env.test.example ใส่แค่ชื่อตัวแปร ฉันจะใส่ค่าหลอกใน .env.test เอง (4) ไม่ต้องแก้ docs/roadmap.md ฉันแก้เอง (5) ไม่ต้องแก้ CLAUDE.md ฉันแก้เอง

## Testing Guidelines
List the test cases only.
- Do NOT write test code for api/src/auth/, api/src/pets/, api/src/applications/, api/src/worker/ — the developer writes those.
- Test files live next to the file they test (xxx.spec.ts), not in a tests/ folder.
- `buildSummaryPrompt`: มี `housingType`, `hasPetExperience`, `note` อยู่ภายใน delimiter
- `buildSummaryPrompt`: ส่ง object ที่มี field เกิน (`email`, `applicantId`, `name`) → ไม่มีค่าเหล่านี้ใน prompt
- `buildSummaryPrompt`: `note` ที่มี delimiter ปลอมและคำสั่ง "ignore previous instructions" → ปิด delimiter ก่อนกำหนดไม่ได้ และคำสั่งยังอยู่ในส่วนข้อมูล
- `buildSummaryPrompt`: ไม่มี `note` → สร้าง prompt ได้
- `buildSummaryPrompt`: มีคำสั่งเรื่อง JSON รูปแบบคงที่, ภาษาไทย และห้ามให้คะแนน/จัดอันดับ
- `parseSummary`: JSON ถูกต้อง → คืนค่าตรงกัน
- `parseSummary`: JSON ห่อด้วย code fence → parse ได้
- `parseSummary`: ไม่ใช่ JSON, ขาด `overview`, `overview` ว่าง, `highlights` ไม่ใช่ array, มีสมาชิกที่ไม่ใช่ string, เกินเพดาน → `AiInvalidResponseError`
- `parseSummary`: มี field เกิน (`score`) → ถูกตัดทิ้ง
- `GeminiAiClient` (mock SDK): ส่ง model จาก config, คืน `response.text`
- `GeminiAiClient`: SDK โยน error → `AiProviderError` ที่ไม่มี key ใน message
- `GeminiAiClient`: คำตอบว่าง → `AiProviderError`
- `GeminiAiClient`: signal ถูกยกเลิกก่อนเรียก → `AiAbortedError` และไม่เรียก SDK
- `GeminiAiClient`: signal ถูกยกเลิกระหว่างรอ → `AiAbortedError`
- `validateEnv`: ขาด `GEMINI_API_KEY` หรือ `AI_MODEL` → error ที่มีแค่ชื่อตัวแปร ไม่มีค่า
- `AiSummariesRepository` (กับ test DB): `upsert` ครั้งแรก insert, ครั้งที่สอง update แถวเดิมและ `updated_at` เปลี่ยน
- `AiSummariesRepository`: `upsert` โดยไม่ส่ง `summary` / `lastError` → ค่าเดิมถูกเขียนทับเป็น `null`
- `AiSummariesRepository`: `findByApplicationId` ที่ไม่มี → `undefined`, ที่มี → `summary` กลับมาเป็น object
- `AiSummariesRepository`: ส่ง `PoolClient` ใน transaction แล้ว rollback → ไม่มีแถวค้าง
- `AiModule`: override `AI_CLIENT` ด้วยตัวปลอมได้
