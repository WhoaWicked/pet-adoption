import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { HOUSING_TYPE_LABELS, PET_STATUS_LABELS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/format'
import type { MyApplication } from '@/lib/types'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'

// ความกว้างคอลัมน์ของแถว (จอ md ขึ้นไป) — skeleton ใน MyApplicationsPage ใช้ค่าเดียวกัน ให้แนวคอลัมน์ตรงกัน
const APPLICATION_ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_10rem_8rem_7.5rem] md:items-center md:gap-6'

// คำขอ 1 แถวในหน้า "คำขอของฉัน" — ไม่มีกล่อง (เส้นคั่นมาจาก <ul> ของหน้า)
// จอใหญ่: ชื่อ+คำตอบ | วันที่ส่ง | ป้ายสถานะ | ปุ่ม  ·  มือถือ: เรียงลงมา
// (API /applications/mine ไม่มีรูปและจังหวัดของน้อง จึงไม่แสดง)
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
    <li className={`flex flex-col gap-3 py-5 ${APPLICATION_ROW_GRID}`}>
      <div className="min-w-0 space-y-1">
        <Link
          to={`/pets/${application.pet_id}`}
          className="block truncate text-lg font-semibold underline-offset-4 hover:text-primary hover:underline"
        >
          {application.pet_name}
        </Link>
        <p className="text-sm text-muted-foreground">
          ที่พัก{HOUSING_TYPE_LABELS[answers.housingType]} · {answers.hasPetExperience ? 'เคยเลี้ยงสัตว์' : 'ยังไม่เคยเลี้ยงสัตว์'}
        </p>
        {/* คำขอยังรอแต่น้องไม่เปิดรับแล้ว (เช่นเจ้าของปิดโพสต์) — เป็นสถานะของน้อง ไม่ซ้ำกับป้ายสถานะคำขอ */}
        {application.status === 'pending' && application.pet_status !== 'available' && (
          <p className="text-sm text-muted-foreground">สถานะน้องตอนนี้: {PET_STATUS_LABELS[application.pet_status]}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">ส่งเมื่อ {formatDate(application.created_at)}</p>

      <div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      {/* ถอนได้เฉพาะคำขอที่รอพิจารณา (เงื่อนไขเดิม) · ช่องว่างคงไว้ให้คอลัมน์ตรงกันทุกแถว */}
      <div className="md:justify-self-end">
        {application.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-field-border/50 bg-card px-4"
            onClick={() => onWithdraw(application)}
            disabled={isWithdrawing}
          >
            ถอนคำขอ
          </Button>
        )}
      </div>
    </li>
  )
}
