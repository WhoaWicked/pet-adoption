import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { useAuth } from './auth-context'
import { loginPath } from './redirect'

// ครอบ route ที่ต้อง login — ยังไม่ login พาไปหน้า login พร้อมจำหน้าที่ตั้งใจจะเข้า
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <LoadingState label="กำลังตรวจสอบการเข้าสู่ระบบ…" />
  if (status === 'anonymous') {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />
  }
  return <Outlet />
}
