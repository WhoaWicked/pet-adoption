import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { HOUSING_TYPE_LABELS, PET_STATUS_LABELS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/format'
import type { MyApplication } from '@/lib/types'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'

// คำขอ 1 รายการในหน้า "คำขอของฉัน"
export function MyApplicationItem({
  application,
  onWithdraw,
  isWithdrawing,
}: {
  application: MyApplication
  onWithdraw: (application: MyApplication) => void
  isWithdrawing: boolean
}) {
  const { answers } = application
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/pets/${application.pet_id}`}
            className="truncate text-base font-semibold underline-offset-4 hover:underline"
          >
            {application.pet_name}
          </Link>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <p className="text-sm text-muted-foreground">ยื่นเมื่อ {formatDate(application.created_at)}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>ที่พัก{HOUSING_TYPE_LABELS[answers.housingType]}</span>
          <span>{answers.hasPetExperience ? 'เคยเลี้ยงสัตว์' : 'ยังไม่เคยเลี้ยงสัตว์'}</span>
        </p>
        {/* คำขอยังรอแต่สัตว์ไม่เปิดรับแล้ว (เช่นเจ้าของปิดโพสต์) — บอกให้รู้ */}
        {application.status === 'pending' && application.pet_status !== 'available' && (
          <p className="text-sm text-muted-foreground">สถานะน้องตอนนี้: {PET_STATUS_LABELS[application.pet_status]}</p>
        )}
      </div>
      {application.status === 'pending' && (
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => onWithdraw(application)}
          disabled={isWithdrawing}
        >
          ถอนคำขอ
        </Button>
      )}
    </li>
  )
}
