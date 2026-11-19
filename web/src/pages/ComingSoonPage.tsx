import { Link } from 'react-router'
import { HammerIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

// หน้าชั่วคราวของ route ที่จะทำในรอบถัดไป — ให้ลิงก์ใน header/การ์ดไม่พาไปหน้า 404
export function ComingSoonPage() {
  return (
    <EmptyState
      icon={<HammerIcon className="size-7" aria-hidden />}
      title="หน้านี้กำลังพัฒนา"
      description="ฟีเจอร์นี้จะเปิดให้ใช้งานเร็ว ๆ นี้"
      action={
        <Button asChild variant="outline" className="h-10 px-4">
          <Link to="/">กลับหน้าแรก</Link>
        </Button>
      }
    />
  )
}
