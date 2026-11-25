// จัดการ ?redirect= ของหน้า login/register

/** หน้าที่พาไปหลัง login/register เมื่อไม่ได้ระบุ ?redirect= — หน้ารายการสัตว์ (ไม่ใช่ landing) ให้ได้เริ่มดูน้อง ๆ ทันที */
export const DEFAULT_AFTER_AUTH = '/pets'

/** รับเฉพาะ path ภายในเว็บ (ขึ้นต้นด้วย "/" แต่ไม่ใช่ "//") กัน open redirect ไปเว็บอื่น */
export function safeRedirect(value: string | null | undefined, fallback = DEFAULT_AFTER_AUTH): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback
  return value
}

/** สร้าง URL หน้า login ที่จำหน้าปัจจุบันไว้ (ถ้าเป็นหน้าเริ่มต้นอยู่แล้วก็ไม่ต้องใส่ ?redirect=) */
export function loginPath(from: string, reason?: 'expired'): string {
  const params = new URLSearchParams()
  const target = safeRedirect(from, '')
  if (target && target !== DEFAULT_AFTER_AUTH) params.set('redirect', target)
  if (reason) params.set('reason', reason)
  const qs = params.toString()
  return qs ? `/login?${qs}` : '/login'
}
