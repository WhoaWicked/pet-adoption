import { ApiError, NetworkError } from './client'

// แปลง error จาก API เป็นข้อความภาษาไทยที่ผู้ใช้อ่านรู้เรื่อง
// ข้อความ message จาก API เป็นภาษาอังกฤษคงที่ (ดูใน api/src/**/*.service.ts) จึงใช้แยกกรณีย่อยได้

const KNOWN_MESSAGES: Record<string, string> = {
  // 401
  'Invalid email or password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  // 403
  'You cannot apply to your own pet': 'ยื่นขอรับเลี้ยงสัตว์ที่คุณโพสต์เองไม่ได้',
  'You do not own this pet': 'คุณไม่ใช่เจ้าของโพสต์นี้ จึงทำรายการนี้ไม่ได้',
  'You do not own this application': 'คำขอนี้ไม่ใช่ของคุณ',
  // 404
  'Pet not found': 'ไม่พบสัตว์ตัวนี้ อาจถูกลบหรือลิงก์ไม่ถูกต้อง',
  'Application not found': 'ไม่พบคำขอนี้',
  'Notification not found': 'ไม่พบการแจ้งเตือนนี้',
  // 409
  'You already applied to this pet': 'คุณยื่นคำขอสัตว์ตัวนี้ไปแล้ว',
  'Pet is not available': 'สัตว์ตัวนี้ไม่เปิดรับคำขอแล้ว',
  'Pet is already adopted': 'สัตว์ตัวนี้มีบ้านแล้ว จึงปิดโพสต์ไม่ได้',
  'Pet cannot be closed': 'ปิดโพสต์ไม่ได้ในขณะนี้ กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง',
  'Only pending applications can be withdrawn': 'ถอนได้เฉพาะคำขอที่ยังรอพิจารณา',
  'Only pending applications can be rejected': 'คำขอนี้ถูกตัดสินไปแล้ว',
  'Only pending applications can be approved': 'คำขอนี้ถูกตัดสินไปแล้ว',
  'Application cannot be withdrawn': 'คำขอนี้เพิ่งถูกเปลี่ยนสถานะ กรุณาโหลดหน้าใหม่',
  'Application cannot be rejected': 'คำขอนี้เพิ่งถูกเปลี่ยนสถานะ กรุณาโหลดหน้าใหม่',
  'Application cannot be approved': 'มีการตัดสินคำขอของสัตว์ตัวนี้ไปแล้ว กรุณาโหลดหน้าใหม่',
  'Resource already exists': 'ข้อมูลนี้มีอยู่ในระบบแล้ว',
  'Operation conflicts with related data': 'ทำรายการไม่ได้เพราะข้อมูลที่เกี่ยวข้องเปลี่ยนไป กรุณาโหลดหน้าใหม่',
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  401: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
  403: 'คุณไม่มีสิทธิ์ทำรายการนี้',
  404: 'ไม่พบข้อมูลที่ต้องการ',
  409: 'ทำรายการไม่ได้เพราะข้อมูลเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่',
}

export const NETWORK_ERROR_MESSAGE = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
const SERVER_ERROR_MESSAGE = 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง'
const UNKNOWN_ERROR_MESSAGE = 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง'

/** ParseUUIDPipe ของ API ตอบ 400 เมื่อ id ใน URL ผิดรูปแบบ — สำหรับผู้ใช้ถือว่า "ไม่พบ" */
export function isInvalidIdError(err: unknown): boolean {
  return err instanceof ApiError && err.statusCode === 400 && /uuid is expected/i.test(err.message)
}

/** ไม่พบข้อมูล (404 หรือ id ผิดรูปแบบ) — ใช้ตัดสินว่าจะแสดงหน้า "ไม่พบ" แทน error ทั่วไป */
export function isNotFoundError(err: unknown): boolean {
  return (err instanceof ApiError && err.statusCode === 404) || isInvalidIdError(err)
}

export interface ErrorMessageOptions {
  /** ข้อความเฉพาะบริบท แทนข้อความตาม status เช่น { 409: 'อีเมลนี้ถูกใช้แล้ว' } */
  overrides?: Partial<Record<number, string>>
}

export function getErrorMessage(err: unknown, options: ErrorMessageOptions = {}): string {
  if (err instanceof NetworkError) return NETWORK_ERROR_MESSAGE
  if (!(err instanceof ApiError)) return UNKNOWN_ERROR_MESSAGE

  const override = options.overrides?.[err.statusCode]
  if (override) return override

  if (isInvalidIdError(err)) return STATUS_MESSAGES[404]
  // 502/504 = proxy (Vite dev / hosting) ติดต่อ API ไม่ได้ — สำหรับผู้ใช้คือเชื่อมต่อไม่ได้
  if (err.statusCode === 502 || err.statusCode === 504) return NETWORK_ERROR_MESSAGE
  if (err.statusCode >= 500) return SERVER_ERROR_MESSAGE

  const known = KNOWN_MESSAGES[err.message]
  if (known) return known

  return STATUS_MESSAGES[err.statusCode] ?? err.message ?? UNKNOWN_ERROR_MESSAGE
}

// ---------- validation error (details) → ข้อความใต้ช่องกรอก ----------

function translateValidationMessage(text: string): string {
  let m: RegExpMatchArray | null
  if (/must be an email/.test(text)) return 'รูปแบบอีเมลไม่ถูกต้อง'
  if (/should not be empty/.test(text)) return 'กรุณากรอกข้อมูลช่องนี้'
  if ((m = text.match(/longer than or equal to (\d+)/))) return `ต้องมีอย่างน้อย ${m[1]} ตัวอักษร`
  if ((m = text.match(/shorter than or equal to (\d+)/))) return `ต้องไม่เกิน ${m[1]} ตัวอักษร`
  if ((m = text.match(/must not be less than (\d+)/))) return `ต้องไม่น้อยกว่า ${m[1]}`
  if (/must be an integer/.test(text)) return 'ต้องเป็นจำนวนเต็ม'
  if (/must be one of/.test(text)) return 'กรุณาเลือกจากตัวเลือกที่มี'
  return 'ข้อมูลไม่ถูกต้อง'
}

export interface ValidationErrors<F extends string> {
  fieldErrors: Partial<Record<F, string>>
  /** ข้อความที่จับคู่กับช่องใดไม่ได้ (แสดงรวมด้านบนฟอร์ม) */
  formError?: string
}

/**
 * class-validator ส่ง details เช่น "email must be an email" — คำแรกคือชื่อ field (camelCase ตาม DTO)
 * จับคู่กับ fields ที่ฟอร์มรู้จัก ที่เหลือรวมเป็น formError
 */
export function getValidationErrors<F extends string>(err: unknown, fields: readonly F[]): ValidationErrors<F> {
  const result: ValidationErrors<F> = { fieldErrors: {} }
  if (!(err instanceof ApiError) || !err.details?.length) return result

  const unmatched: string[] = []
  for (const detail of err.details) {
    const field = detail.split(' ')[0]?.split('.').pop() as F | undefined
    if (field && fields.includes(field) && !result.fieldErrors[field]) {
      result.fieldErrors[field] = translateValidationMessage(detail)
    } else {
      unmatched.push(detail)
    }
  }
  if (unmatched.length) result.formError = STATUS_MESSAGES[400]
  return result
}
