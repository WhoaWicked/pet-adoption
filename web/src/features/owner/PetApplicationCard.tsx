import { Button } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/features/applications/ApplicationStatusBadge'
import { HOUSING_TYPE_LABELS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/format'
import type { PetApplication } from '@/lib/types'
import { ApplicationSummary } from './ApplicationSummary'

// คำขอ 1 รายการในหน้าจัดการ: ผู้ยื่น + คำตอบ + สรุป AI + ปุ่มตัดสิน (เฉพาะ pending)
export function PetApplicationCard({
  application,
  canApprove,
  disabled,
  onApprove,
  onReject,
}: {
  application: PetApplication
  /** อนุมัติได้เฉพาะตอนสัตว์ยัง available (ไม่งั้น API ตอบ 409) */
  canApprove: boolean
  disabled: boolean
  onApprove: (application: PetApplication) => void
  onReject: (application: PetApplication) => void
}) {
  const { answers } = application
  const isPending = application.status === 'pending'

  return (
    // รอพิจารณา = ต้องตัดสิน → พื้นการ์ดเต็ม + แถบสีหลักด้านซ้าย · ตัดสินแล้ว = พื้นจาง ย่อคำตอบเหลือบรรทัดเดียว
    <li
      className={
        isPending
          ? 'space-y-4 rounded-2xl border-l-4 border-primary bg-card p-4 shadow-xs sm:p-5'
          : 'space-y-1 rounded-2xl bg-secondary/60 px-4 py-3 sm:px-5'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={isPending ? 'truncate font-semibold' : 'truncate font-medium text-muted-foreground'}>
            {application.applicant_name}
          </p>
          <p className="text-sm text-muted-foreground">ยื่นเมื่อ {formatDate(application.created_at)}</p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      {!isPending && (
        <p className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          <span>ที่พัก{HOUSING_TYPE_LABELS[answers.housingType]}</span>
          <span>{answers.hasPetExperience ? 'เคยเลี้ยง' : 'ยังไม่เคยเลี้ยง'}</span>
        </p>
      )}

      {isPending && (
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">ที่พักอาศัย</dt>
          <dd>{HOUSING_TYPE_LABELS[answers.housingType]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ประสบการณ์เลี้ยงสัตว์</dt>
          <dd>{answers.hasPetExperience ? 'เคยเลี้ยง' : 'ยังไม่เคยเลี้ยง'}</dd>
        </div>
        {answers.note && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">ข้อความถึงเจ้าของ</dt>
            <dd className="whitespace-pre-line break-words">{answers.note}</dd>
          </div>
        )}
      </dl>
      )}

      {isPending && <ApplicationSummary applicationId={application.id} disabled={disabled} />}

      {isPending && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onReject(application)} disabled={disabled}>
            ปฏิเสธ
          </Button>
          {canApprove && (
            <Button onClick={() => onApprove(application)} disabled={disabled}>
              อนุมัติ
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
