import { clearToken, getToken } from '@/features/auth/token-storage'

// api client ตัวเดียวของแอป — ทุก request ไป API ต้องผ่าน apiRequest()

// ตัด / ท้ายออก เพราะ path ที่เรียกขึ้นต้นด้วย / อยู่แล้ว (กันได้ URL แบบ //pets)
const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
).replace(/\/+$/, '')

/** error ที่ API ตอบกลับมา (shape เดียวกับ global exception filter ของ API) */
export class ApiError extends Error {
  readonly statusCode: number
  readonly error: string
  readonly details?: string[]

  constructor(statusCode: number, error: string, message: string, details?: string[]) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.error = error
    this.details = details
  }
}

/** เรียก API ไม่ได้เลย (เซิร์ฟเวอร์ปิด, เน็ตหลุด) */
export class NetworkError extends Error {
  constructor() {
    super('Network request failed')
    this.name = 'NetworkError'
  }
}

/**
 * พฤติกรรมเมื่อได้ 401 จาก request ที่แนบ token ไป
 * - redirect: logout แล้วพาไปหน้า login (ค่าเริ่มต้น)
 * - silent:   แค่ลบ token ทิ้ง ไม่พาไปไหน (ใช้ตอนเช็ค token ตอนเปิดเว็บ)
 * - ignore:   ไม่ทำอะไร ปล่อยให้ผู้เรียกจัดการเอง (ใช้กับ login)
 */
export type On401 = 'redirect' | 'silent' | 'ignore'

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  /** แนบ Bearer token ถ้ามี (ค่าเริ่มต้น true) */
  auth?: boolean
  on401?: On401
  signal?: AbortSignal
}

// AuthProvider ลงทะเบียน handler นี้ — แยกไว้แบบนี้เพื่อไม่ให้ client import context (กัน import วน)
let unauthorizedHandler: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

/** สร้าง query string โดยตัด key ที่ค่าว่างทิ้ง (API ตอบ 400 ถ้าส่ง param ค่าว่าง) */
export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function readBody(response: Response): Promise<unknown> {
  // save/unsave ตอบ body ว่าง → คืน undefined แทนการ parse JSON ที่จะพัง
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const fallback = `Request failed with status ${status}`
  if (typeof body !== 'object' || body === null) {
    return new ApiError(status, 'UNKNOWN', fallback)
  }
  const b = body as Record<string, unknown>
  const message = typeof b.message === 'string' ? b.message : fallback
  const error = typeof b.error === 'string' ? b.error : 'UNKNOWN'
  const statusCode = typeof b.statusCode === 'number' ? b.statusCode : status
  const details = Array.isArray(b.details)
    ? b.details.filter((d): d is string => typeof d === 'string')
    : undefined
  return new ApiError(statusCode, error, message, details)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true, on401 = 'redirect', signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // ถูกยกเลิกโดย TanStack Query (เช่นเปลี่ยนหน้าเร็ว ๆ) ไม่ใช่ network error
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new NetworkError()
  }

  const data = await readBody(response)

  if (!response.ok) {
    // นับ 401 เฉพาะ request ที่แนบ token ไป — ถ้าไม่ได้แนบ (เช่น login) ไม่ถือว่า session หมดอายุ
    if (response.status === 401 && token && on401 !== 'ignore') {
      if (on401 === 'redirect' && unauthorizedHandler) unauthorizedHandler()
      else clearToken()
    }
    throw toApiError(response.status, data)
  }

  return data as T
}
