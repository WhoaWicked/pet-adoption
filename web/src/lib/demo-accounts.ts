// บัญชีทดลองของหน้า login (อีเมลตรงกับ api/scripts/seed-data.json)
// ค่าในไฟล์นี้ถูกรวมไปกับ JavaScript ฝั่งเว็บ ใครก็อ่านได้ ใช้กับบัญชีข้อมูลปลอมเท่านั้น
import type { LoginInput } from '@/lib/api/endpoints'

// รหัสผ่านต้องตรงกับ DEMO_PASSWORD ตอนรัน seed
const DEMO_PASSWORD = 'demopassword'

export interface DemoAccount extends LoginInput {
  label: string
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { label: 'เจ้าของสัตว์', email: 'demo-owner@example.com', password: DEMO_PASSWORD },
  { label: 'ผู้ขอรับเลี้ยง', email: 'demo-adopter@example.com', password: DEMO_PASSWORD },
]
