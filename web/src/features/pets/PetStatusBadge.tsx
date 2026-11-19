import { Badge } from '@/components/ui/badge'
import { PET_STATUS_LABELS } from '@/lib/constants/labels'
import type { PetStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// สีของแต่ละสถานะมาจาก token --status-* ใน index.css
const STATUS_CLASSES: Record<PetStatus, string> = {
  available: 'bg-status-available text-status-available-foreground',
  adopted: 'bg-status-adopted text-status-adopted-foreground',
  closed: 'bg-status-closed text-status-closed-foreground',
}

export function PetStatusBadge({ status, className }: { status: PetStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent font-medium', STATUS_CLASSES[status], className)}>
      {PET_STATUS_LABELS[status]}
    </Badge>
  )
}
