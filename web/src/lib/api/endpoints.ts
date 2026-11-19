import type { LoginResponse, Me, Paged, Pet, RegisteredUser, Species } from '@/lib/types'
import { apiRequest } from './client'

// ฟังก์ชันเรียก API แต่ละ endpoint — body เป็น camelCase และมีเฉพาะ field ที่ DTO รับ
// (API ใช้ forbidNonWhitelisted: ส่ง field เกินจะโดน 400)

// ---------- auth ----------

export interface LoginInput {
  email: string
  password: string
}

export function login({ email, password }: LoginInput) {
  // ไม่แนบ token และไม่ให้ 401 (รหัสผิด) ไป trigger logout/redirect
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
    on401: 'ignore',
  })
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export function register({ email, password, displayName }: RegisterInput) {
  return apiRequest<RegisteredUser>('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
    auth: false,
  })
}

/** ใช้ตรวจว่า token ยังใช้ได้ตอนเปิดเว็บ — 401 ให้ลบ token เงียบ ๆ ไม่เด้งไปหน้า login */
export function getMe(signal?: AbortSignal) {
  return apiRequest<Me>('/auth/me', { on401: 'silent', signal })
}

// ---------- pets ----------

export interface PetListFilter {
  species?: Species
  province?: string
  limit: number
  offset: number
}

export function listPets(filter: PetListFilter, signal?: AbortSignal) {
  // ค่า undefined ถูกตัดทิ้งใน buildQuery → ไม่มี param ค่าว่างไปถึง API
  return apiRequest<Paged<Pet>>('/pets', {
    query: { species: filter.species, province: filter.province, limit: filter.limit, offset: filter.offset },
    auth: false,
    signal,
  })
}
