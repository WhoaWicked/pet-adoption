import type { ApplicationStatus, HousingType, PetStatus, Species } from '@/lib/types'

// label ภาษาไทยของ enum ที่มาจาก API (ค่าที่ส่งไป/รับมายังเป็นภาษาอังกฤษตาม DTO)

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'สุนัข',
  cat: 'แมว',
  other: 'อื่น ๆ',
}

export const PET_STATUS_LABELS: Record<PetStatus, string> = {
  available: 'รอบ้าน',
  adopted: 'มีบ้านแล้ว',
  closed: 'ปิดรับแล้ว',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่ได้รับเลือก',
  withdrawn: 'ถอนแล้ว',
}

export const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  house: 'บ้าน',
  condo: 'คอนโด',
  apartment: 'อพาร์ตเมนต์',
  other: 'อื่น ๆ',
}

export const SPECIES_OPTIONS = Object.keys(SPECIES_LABELS) as Species[]

export function isSpecies(value: unknown): value is Species {
  return typeof value === 'string' && Object.hasOwn(SPECIES_LABELS, value)
}
