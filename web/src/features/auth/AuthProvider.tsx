import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError, setUnauthorizedHandler } from '@/lib/api/client'
import { getMe, login as loginRequest, type LoginInput } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import { loginPath } from './redirect'
import { clearToken, getToken, setToken } from './token-storage'

// เก็บสถานะ login ของทั้งแอป — token อยู่ใน localStorage, user id มาจาก /auth/me (cache ใน TanStack Query)
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [hasToken, setHasToken] = useState(() => getToken() !== null)
  // กันเด้งไปหน้า login ซ้ำเมื่อหลาย request ได้ 401 พร้อมกัน (รีเซ็ตเมื่อ login ใหม่สำเร็จ)
  const handlingUnauthorized = useRef(false)

  // ตรวจ token ทุกครั้งที่เปิดเว็บ — getMe ใช้ on401: 'silent' จึงแค่ลบ token ไม่เด้ง
  const me = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: ({ signal }) => getMe(signal),
    enabled: hasToken,
    staleTime: Infinity,
  })

  // token เสีย/หมดอายุ (client ลบ token ให้แล้ว) — คำนวณสถานะจากผลของ query ตรง ๆ ไม่ต้องเก็บ state เพิ่ม
  const meUnauthorized = me.error instanceof ApiError && me.error.statusCode === 401

  const logout = useCallback(() => {
    clearToken()
    setHasToken(false)
    // ล้าง cache ทั้งหมด กันข้อมูลของผู้ใช้คนก่อนค้างอยู่
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(
    async (input: LoginInput) => {
      const { accessToken } = await loginRequest(input)
      setToken(accessToken)
      // ดึง /auth/me ให้เสร็จก่อน เพื่อให้หน้าถัดไปเห็นสถานะ authenticated ทันที
      queryClient.removeQueries({ queryKey: queryKeys.auth.me })
      await queryClient.fetchQuery({ queryKey: queryKeys.auth.me, queryFn: ({ signal }) => getMe(signal) })
      handlingUnauthorized.current = false
      setHasToken(true)
    },
    [queryClient],
  )

  // 401 จาก request ใดก็ได้ที่แนบ token → logout แล้วไปหน้า login (จำหน้าปัจจุบันไว้)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (handlingUnauthorized.current) return
      handlingUnauthorized.current = true
      logout()
      const { pathname, search } = window.location
      navigate(loginPath(pathname + search, 'expired'), { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [logout, navigate])

  let status: AuthStatus
  if (!hasToken || meUnauthorized) status = 'anonymous'
  else if (me.isPending) status = 'checking'
  // /auth/me ล้มด้วยเหตุอื่น (เช่น เซิร์ฟเวอร์ล่ม) — ยังถือว่า login อยู่ ถ้า token หมดอายุจริง request ถัดไปจะได้ 401 เอง
  else status = 'authenticated'

  const value = useMemo<AuthContextValue>(
    () => ({ status, userId: me.data?.id ?? null, login, logout }),
    [status, me.data?.id, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
