import type { ReactNode } from 'react'

// หัวเรื่องของแต่ละหน้า (ชื่อหน้า + คำอธิบาย + ปุ่มด้านขวา) — ขนาดหัวข้อเดียวกับ /pets และหน้าอื่น
export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
