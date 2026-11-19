// จัดการ ?redirect= ของหน้า login/register

/** รับเฉพาะ path ภายในเว็บ (ขึ้นต้นด้วย "/" แต่ไม่ใช่ "//") กัน open redirect ไปเว็บอื่น */
export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback
  return value
}

/** สร้าง URL หน้า login ที่จำหน้าปัจจุบันไว้ */
export function loginPath(from: string, reason?: 'expired'): string {
  const params = new URLSearchParams()
  const target = safeRedirect(from, '')
  if (target && target !== '/') params.set('redirect', target)
  if (reason) params.set('reason', reason)
  const qs = params.toString()
  return qs ? `/login?${qs}` : '/login'
}
