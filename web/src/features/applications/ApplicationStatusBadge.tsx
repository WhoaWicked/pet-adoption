import { Badge } from '@/components/ui/badge'
import { APPLICATION_STATUS_LABELS } from '@/lib/constants/labels'
import type { ApplicationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// ป้ายตัวหนังสือบนพื้นอ่อน สีตามความหมาย (token เดิม ไม่เพิ่มสีใหม่):
// รอพิจารณา / ถอนแล้ว = เทา (5.8:1) · อนุมัติแล้ว = เขียว (7.6:1) · ไม่ได้รับเลือก = แดงอ่อน (5.2:1)
// ใช้ทั้งหน้า "คำขอของฉัน" และหน้าจัดการของเจ้าของ → ความหมายสีเดียวกันทั้งเว็บ
const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  pending: 'bg-status-closed text-status-closed-foreground',
  approved: 'bg-status-available text-status-available-foreground',
  rejected: 'bg-destructive/10 text-destructive',
  withdrawn: 'bg-status-closed text-status-closed-foreground',
}

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent font-medium', STATUS_CLASSES[status], className)}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  )
}
