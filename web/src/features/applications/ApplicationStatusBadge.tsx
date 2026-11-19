import { Badge } from '@/components/ui/badge'
import { APPLICATION_STATUS_LABELS } from '@/lib/constants/labels'
import type { ApplicationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// ใช้ token สถานะชุดเดิม (ไม่เพิ่มสีใหม่): อนุมัติ = เขียว, รอพิจารณา = เหลืองอุ่น, ไม่ได้รับเลือก/ถอน = เทา
const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  pending: 'bg-status-adopted text-status-adopted-foreground',
  approved: 'bg-status-available text-status-available-foreground',
  rejected: 'bg-status-closed text-status-closed-foreground',
  withdrawn: 'bg-status-closed text-status-closed-foreground',
}

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent font-medium', STATUS_CLASSES[status], className)}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  )
}
