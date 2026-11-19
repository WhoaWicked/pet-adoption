import { Link } from 'react-router'
import { SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<SearchXIcon className="size-7" aria-hidden />}
      title="ไม่พบหน้าที่คุณต้องการ"
      description="ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว"
      action={
        <Button asChild variant="outline" className="h-10 px-4">
          <Link to="/">กลับหน้าแรก</Link>
        </Button>
      }
    />
  )
}
