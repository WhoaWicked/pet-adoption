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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
