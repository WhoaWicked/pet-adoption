import type { ReactNode } from 'react'
import { Link } from 'react-router'

// กรอบกลางจอของหน้า login / register (ใช้ร่วมกัน 2 หน้า)
// - จอ sm ขึ้นไป: กล่องเดียวตาม DESIGN.md (ขอบ 1px โค้ง 20px ไม่มีเงา) กว้าง ~416px
// - มือถือ: ไม่มีกล่อง ฟอร์มวางบนพื้นหน้าเต็มความกว้าง (ระยะขอบข้างมาจาก AppLayout) ไม่ให้ดูแน่น
// - ส่วนหัว: wordmark เดียวกับ Header → หัวข้อ → คำอธิบายบรรทัดเดียว · ส่วนท้าย: ลิงก์สลับหน้า
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[26rem] py-4 sm:py-10">
      <div className="sm:rounded-[1.25rem] sm:border sm:bg-card sm:p-8">
        <header className="mb-8 text-center">
          <Link to="/" className="text-xl font-bold text-primary">
            บ้านใหม่
          </Link>
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </header>
        {children}
        <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}
