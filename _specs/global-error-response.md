# Spec for global-error-response

branch: claude/feature/global-error-response
ownership: ✍️ developer implements (AI gives hints/review only)
ยกเว้น: ติดตั้งและเปิด ValidationPipe แบบ global เป็นงาน config (🤖)

## Summary
- ทุก error ของ API ตอบกลับด้วย JSON รูปแบบเดียวกันทั้งระบบ
- ครอบคลุม 4 กลุ่ม: HttpException, validation error, error จาก Postgres ที่รู้จัก, error ที่ไม่รู้จัก
- error ที่ไม่รู้จักตอบ 500 ข้อความทั่วไป ห้ามหลุด SQL, ชื่อตาราง/constraint, ค่าข้อมูล หรือ stack trace
- ตัวจัดการ error อยู่ใน api/src/common/filters/

## รูปแบบ error (ตัดสินใจแล้ว)
- ทุก error มี 3 ฟิลด์: statusCode (ตัวเลข), error (รหัสคงที่ภาษาอังกฤษ เช่น NOT_FOUND,
  VALIDATION_FAILED, CONFLICT, INTERNAL_ERROR), message (ข้อความภาษาอังกฤษ)
- validation error มีฟิลด์ details เพิ่ม เป็นรายการข้อความจาก ValidationPipe
- ฝั่ง web ใช้รหัสใน error แปลเป็นภาษาไทยเอง

## Functional Requirements
- HttpException ทุกชนิดคง status code เดิม และแปลงเป็นรูปแบบกลาง
  รองรับทั้ง response ที่เป็นสตริงและเป็น object
- validation error จาก ValidationPipe ตอบ 400 พร้อม details
- error จาก Postgres:
  - unique violation (23505) → 409
  - foreign key violation (23503) → 409
  - check violation (23514) → 400
  - ข้อความเป็นข้อความทั่วไป ห้ามใช้ detail, ชื่อ constraint หรือค่าข้อมูลจาก error ของ pg
- error อื่นทั้งหมด (รวมค่าที่ throw ซึ่งไม่ใช่ Error) → 500 ข้อความทั่วไป
- error 5xx ถูก log ฝั่งเซิร์ฟเวอร์พร้อมรายละเอียดเต็ม แต่ไม่อยู่ใน response
- /health ใช้รูปแบบใหม่ ยังตอบ 503 เมื่อ database ล้ม (แก้เทสต์ของ /health ให้ตรง)

## Possible Edge Cases
- route ที่ไม่มีอยู่ (404 จาก framework)
- JSON body ที่ parse ไม่ได้
- error ของ pg ที่ไม่มี code
- ค่าที่ throw เป็นสตริง หรือ null

## Acceptance Criteria
- เรียก API จริงแล้วทุกกลุ่ม error ได้รูปแบบเดียวกัน
- error ที่ไม่รู้จักตอบ 500 โดย body ไม่มี SQL, stack trace หรือ path ของไฟล์
- HttpException เดิมคง status code เดิม
- /health ตอบ 503 ในรูปแบบใหม่เมื่อ database ล้ม
- npm run lint, build, test, test:e2e ผ่าน

## Open Questions (ตอบแล้ว)
- /health: ใช้รูปแบบใหม่ status ยังเป็น 503 Render ดูแค่ status
- โครงสร้าง JSON: statusCode, error, message (+ details สำหรับ validation)
- foreign key: 409 ทั้งสองกรณี กรณีอ้างถึงข้อมูลที่ไม่มี service ต้องเช็กก่อนแล้วตอบ 404 เอง
- check violation: 400 และ log ไว้ เพราะแปลว่า validation ฝั่ง app ตกหล่น
- ข้อความ unique violation: ข้อความทั่วไป ("Resource already exists") กรณีอีเมลซ้ำให้ Auth จัดการเองในข้อ 4
- ภาษา: อังกฤษ ฝั่ง web แปลจากรหัสใน error
- validation library: class-validator + class-transformer ผ่าน ValidationPipe แบบ global
- request id: ยังไม่ทำ
- error ของ pg อื่น (deadlock, serialization failure): 500 ไปก่อน จัดการในข้อ 7

## Testing Guidelines
List the test cases only. Developer writes all test code for this step.
- Unit test อยู่ข้างไฟล์ (xxx.spec.ts), e2e อยู่ใน api/test/
- HttpException ที่ response เป็นสตริง และเป็น object → คง status เดิม รูปแบบกลาง
- validation error → 400 พร้อม details
- pg 23505 → 409, 23503 → 409, 23514 → 400 และ body ไม่มีชื่อ constraint
- Error ธรรมดา → 500 body ไม่มี stack trace
- ค่าที่ throw ไม่ใช่ Error → 500
- error 500 ถูกส่งเข้า log
- e2e: route ที่ไม่มีอยู่ → 404 รูปแบบกลาง
- e2e: /health ตอบ 503 รูปแบบใหม่เมื่อ database ล้ม