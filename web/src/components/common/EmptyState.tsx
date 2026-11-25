import type { ReactNode } from 'react'
import { PawPrintIcon } from 'lucide-react'

// สถานะไม่มีข้อมูล: ไอคอน + หัวข้อ + คำอธิบาย + ปุ่ม action (ไม่บังคับ)
export function EmptyState({
  title,
  description,
  action,
  icon = <PawPrintIcon className="size-7" aria-hidden />,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    // ไม่มีกล่อง/เส้นประ: กึ่งกลางบนพื้นหน้า · วงไอคอนสีเน้นอ่อน
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="mb-1 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
