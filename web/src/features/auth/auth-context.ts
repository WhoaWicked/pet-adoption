import { createContext, useContext } from 'react'
import type { LoginInput } from '@/lib/api/endpoints'

/**
 * - checking:      มี token แต่ยังตรวจกับ /auth/me ไม่เสร็จ
 * - authenticated: token ใช้ได้
 * - anonymous:     ไม่มี token หรือ token ใช้ไม่ได้
 */
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  /** id ของผู้ใช้ (จาก /auth/me) ใช้เทียบกับ owner_id — อาจเป็น null ถ้า /auth/me เรียกไม่สำเร็จด้วยเหตุอื่นที่ไม่ใช่ 401 */
  userId: string | null
  login: (input: LoginInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
