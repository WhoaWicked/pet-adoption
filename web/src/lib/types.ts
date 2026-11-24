// รูปแบบข้อมูลจาก API — response เป็น snake_case ตามจริง (ยกเว้น login ที่ตอบ accessToken)

export type Species = 'dog' | 'cat' | 'other'
export type PetStatus = 'available' | 'adopted' | 'closed'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type HousingType = 'house' | 'condo' | 'apartment' | 'other'

export interface Pet {
  id: string
  owner_id: string
  name: string
  species: Species
  age_months: number
  province: string
  description: string
  requirements: string
  image_url: string | null
  status: PetStatus
  created_at: string
  updated_at: string
}

export interface PageMeta {
  total: number
  limit: number
  offset: number
}

export interface Paged<T> {
  data: T[]
  meta: PageMeta
}

export interface ApplicationAnswers {
  housingType: HousingType
  hasPetExperience: boolean
  note?: string
}

export interface Application {
  id: string
  pet_id: string
  applicant_id: string
  answers: ApplicationAnswers
  status: ApplicationStatus
  created_at: string
  decided_at: string | null
}

/** แถวจาก GET /applications/mine — มีชื่อและสถานะของสัตว์มาด้วย */
export interface MyApplication extends Application {
  pet_name: string
  pet_status: PetStatus
}

/** แถวจาก GET /applications/pet/:petId (เจ้าของดู) — มีชื่อผู้ยื่นมาด้วย */
export interface PetApplication extends Application {
  applicant_name: string
}

/** สรุปคำขอโดย AI — ให้อ่านประกอบเท่านั้น ไม่มีคะแนนหรือคำแนะนำให้อนุมัติ/ปฏิเสธ */
export interface AiSummary {
  overview: string
  highlights: string[]
  concerns: string[]
}

/** ผลจาก POST /applications/:id/summary */
export interface ApplicationSummaryResult {
  summary: AiSummary
  updated_at: string
}

/** แจ้งเตือนในแอป — id เป็น string เพราะเป็น BIGSERIAL (pg คืนเป็น string) */
export interface Notification {
  id: string
  user_id: string
  type: string
  /** id ของคำขอรับเลี้ยง (ไม่ใช่ id ของสัตว์) */
  entity_id: string
  message: string
  read_at: string | null
  created_at: string
}

export interface LoginResponse {
  accessToken: string
}

export interface RegisteredUser {
  id: string
  email: string
  display_name: string
}

export interface Me {
  id: string
}
