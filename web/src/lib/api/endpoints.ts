import type {
  Application,
  ApplicationAnswers,
  LoginResponse,
  Me,
  MyApplication,
  PetApplication,
  Paged,
  Pet,
  RegisteredUser,
  Species,
} from '@/lib/types'
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

/** รายละเอียดสัตว์ — ดูได้โดยไม่ต้อง login (คืนทุกสถานะ) */
export function getPet(id: string, signal?: AbortSignal) {
  return apiRequest<Pet>(`/pets/${encodeURIComponent(id)}`, { auth: false, signal })
}

/** สัตว์ที่ผู้ใช้บันทึกไว้ ทุกสถานะ (array ไม่มี meta) */
export function listSavedPets(signal?: AbortSignal) {
  return apiRequest<Pet[]>('/pets/saved', { signal })
}

export interface CreatePetInput {
  name: string
  species: Species
  ageMonths: number
  province: string
  description: string
  requirements: string
  imageUrl?: string
}

/** ลงประกาศ — ส่งเฉพาะ field ของ CreatePetDto และไม่ส่ง imageUrl เมื่อว่าง */
export function createPet(input: CreatePetInput) {
  const imageUrl = input.imageUrl?.trim()
  return apiRequest<Pet>('/pets', {
    method: 'POST',
    body: {
      name: input.name,
      species: input.species,
      ageMonths: input.ageMonths,
      province: input.province,
      description: input.description,
      requirements: input.requirements,
      ...(imageUrl ? { imageUrl } : {}),
    },
  })
}

/** บันทึก/เลิกบันทึก — API ตอบ body ว่าง และทำซ้ำได้ */
export function savePet(id: string) {
  return apiRequest<void>(`/pets/${encodeURIComponent(id)}/save`, { method: 'PUT' })
}

export function unsavePet(id: string) {
  return apiRequest<void>(`/pets/${encodeURIComponent(id)}/save`, { method: 'DELETE' })
}

// ---------- applications ----------

export interface CreateApplicationInput {
  petId: string
  answers: ApplicationAnswers
}

export function createApplication({ petId, answers }: CreateApplicationInput) {
  // ส่ง note เฉพาะเมื่อมีข้อความ — body ตรงกับ CreateApplicationDto/AnswersDto พอดี
  const note = answers.note?.trim()
  return apiRequest<Application>('/applications', {
    method: 'POST',
    body: {
      petId,
      answers: {
        housingType: answers.housingType,
        hasPetExperience: answers.hasPetExperience,
        ...(note ? { note } : {}),
      },
    },
  })
}

export interface PageRequest {
  limit: number
  offset: number
}

/** คำขอที่ผู้ใช้ยื่น ใหม่สุดก่อน พร้อม pet_name / pet_status */
export function listMyApplications({ limit, offset }: PageRequest, signal?: AbortSignal) {
  return apiRequest<Paged<MyApplication>>('/applications/mine', { query: { limit, offset }, signal })
}

/** ถอนคำขอ (เฉพาะ pending — สถานะอื่นได้ 409) */
export function withdrawApplication(id: string) {
  return apiRequest<Application>(`/applications/${encodeURIComponent(id)}/withdraw`, { method: 'PATCH' })
}

// ---------- owner ----------

/** สัตว์ที่ผู้ใช้ลงประกาศ ทุกสถานะ ใหม่สุดก่อน (array ไม่มี meta) */
export function listMyPets(signal?: AbortSignal) {
  return apiRequest<Pet[]>('/pets/mine', { signal })
}

/** คำขอของสัตว์ตัวหนึ่ง (เฉพาะเจ้าของ — ไม่ใช่เจ้าของได้ 403) — API ห่อมาเป็น { data } */
export async function listPetApplications(petId: string, signal?: AbortSignal) {
  const res = await apiRequest<{ data: PetApplication[] }>(`/applications/pet/${encodeURIComponent(petId)}`, { signal })
  return res.data
}

/** อนุมัติ — API ปฏิเสธคำขอ pending อื่นของสัตว์ตัวนี้และเปลี่ยนสัตว์เป็น adopted ใน transaction เดียว */
export function approveApplication(id: string) {
  return apiRequest<Application>(`/applications/${encodeURIComponent(id)}/approve`, { method: 'PATCH' })
}

export function rejectApplication(id: string) {
  return apiRequest<Application>(`/applications/${encodeURIComponent(id)}/reject`, { method: 'PATCH' })
}

/** ปิดโพสต์ (ไม่มีการลบ) — adopted แล้วได้ 409 */
export function closePet(id: string) {
  return apiRequest<Pet>(`/pets/${encodeURIComponent(id)}/close`, { method: 'PATCH' })
}
