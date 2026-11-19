import { Loader2Icon } from 'lucide-react'

// สถานะกำลังโหลดแบบทั่วไป (หน้าที่มีโครงชัดเจนใช้ Skeleton ของตัวเองแทน)
export function LoadingState({ label = 'กำลังโหลด…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2Icon className="size-6 animate-spin" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  )
}
