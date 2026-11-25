import { Link } from 'react-router'
import { SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

// 404 / route ที่ไม่มี: ข้อความไทยเป็นมิตร + ทางไปต่อ 2 ทาง (หน้าแรก = ปุ่มหลัก, รายการน้อง = ปุ่มรอง)
export function NotFoundPage() {
  return (
    <EmptyState
      icon={<SearchXIcon className="size-7" aria-hidden />}
      title="ไม่พบหน้าที่คุณต้องการ"
      description="ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว ลองกลับไปเริ่มที่หน้าแรกหรือดูน้อง ๆ ที่กำลังรอบ้านได้เลย"
      action={
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full px-6">
            <Link to="/">กลับหน้าแรก</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-field-border/50 bg-card px-6">
            <Link to="/pets">ดูน้อง ๆ ทั้งหมด</Link>
          </Button>
        </div>
      }
    />
  )
}
