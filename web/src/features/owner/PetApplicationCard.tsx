import { Button } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/features/applications/ApplicationStatusBadge'
import { HOUSING_TYPE_LABELS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/format'
import type { PetApplication } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ApplicationSummary } from './ApplicationSummary'

// คำตอบของผู้ยื่น: label | ค่า 2 คอลัมน์ คั่นแต่ละแถวด้วยเส้นบาง (ไม่มีกล่อง)
function AnswerList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="text-sm">
      {items.map(({ label, value }) => (
        <div key={label} className="grid gap-1 border-t py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-line break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// คำขอ 1 รายการในหน้าจัดการ = บล็อกเดียว (การ์ดขอบ 1px ไม่มีเงา) แบ่งส่วนภายในด้วยเส้นบาง:
// หัว (ผู้ยื่น / วันที่ / สถานะ) → คำตอบ → สรุป AI (เฉพาะ pending) → ปุ่มตัดสิน (เฉพาะ pending)
export function PetApplicationCard({
  application,
  canApprove,
  disabled,
  onApprove,
  onReject,
  enterDelay,
}: {
  application: PetApplication
  /** อนุมัติได้เฉพาะตอนสัตว์ยัง available (ไม่งั้น API ตอบ 409) */
  canApprove: boolean
  disabled: boolean
  onApprove: (application: PetApplication) => void
  onReject: (application: PetApplication) => void
  /** มีค่า = เล่นอนิเมชันเข้า (เฉพาะตอนเข้าหน้า) ด้วยดีเลย์นี้ (ms) */
  enterDelay?: number
}) {
  const { answers } = application
  const isPending = application.status === 'pending'

  // ข้อมูลเท่าที่ของเดิมแสดง: pending มีข้อความถึงเจ้าของด้วย (ถ้ามี) · ตัดสินแล้วแสดงแค่ที่พักและประสบการณ์
  const answerItems = [
    { label: 'ที่พักอาศัย', value: HOUSING_TYPE_LABELS[answers.housingType] },
    { label: 'ประสบการณ์เลี้ยงสัตว์', value: answers.hasPetExperience ? 'เคยเลี้ยง' : 'ยังไม่เคยเลี้ยง' },
    ...(isPending && answers.note ? [{ label: 'ข้อความถึงเจ้าของ', value: answers.note }] : []),
  ]

  return (
    <li
      className={cn('space-y-4 rounded-[1.25rem] border bg-card p-5 sm:p-6', enterDelay !== undefined && 'animate-enter')}
      style={enterDelay !== undefined ? { animationDelay: `${enterDelay}ms` } : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {/* คำขอที่ตัดสินแล้วดูเบากว่า ให้ pending ที่ต้องตัดสินเด่นกว่าโดยไม่ใช้แถบสี */}
          <p className={isPending ? 'truncate text-lg font-semibold' : 'truncate text-lg font-semibold text-muted-foreground'}>
            {application.applicant_name}
          </p>
          <p className="text-sm text-muted-foreground">ส่งเมื่อ {formatDate(application.created_at)}</p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <AnswerList items={answerItems} />

      {isPending && <ApplicationSummary applicationId={application.id} disabled={disabled} />}

      {isPending && (
        // ปุ่มตัดสินท้ายบล็อก · มือถือเรียงลงเต็มความกว้าง (อนุมัติอยู่บน)
        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="rounded-full border-field-border/50 bg-card px-6"
            onClick={() => onReject(application)}
            disabled={disabled}
          >
            ปฏิเสธ
          </Button>
          {canApprove && (
            <Button className="rounded-full px-6" onClick={() => onApprove(application)} disabled={disabled}>
              อนุมัติ
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
