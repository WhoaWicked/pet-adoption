import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { HomeIcon, LockIcon, SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplyForm } from '@/features/applications/ApplyForm'
import { useAuth } from '@/features/auth/auth-context'
import { loginPath } from '@/features/auth/redirect'
import type { Pet } from '@/lib/types'

function Notice({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">{icon}</div>
      <p className="font-semibold">{title}</p>
      {children}
    </div>
  )
}

// กล่อง "รับเลี้ยง" ในหน้ารายละเอียด — เลือกว่าจะแสดงฟอร์มหรือข้อความแทนตามสถานะสัตว์และผู้ใช้
export function AdoptionPanel({ pet }: { pet: Pet }) {
  const { status, userId } = useAuth()
  const location = useLocation()

  let content: ReactNode
  if (status === 'authenticated' && userId === pet.owner_id) {
    // 1. เจ้าของโพสต์ยื่นขอสัตว์ตัวเองไม่ได้ → พาไปหน้าจัดการแทน
    content = (
      <Notice icon={<SettingsIcon className="size-6" aria-hidden />} title="นี่คือโพสต์ของคุณ">
        <p className="text-sm text-muted-foreground">ดูคำขอที่เข้ามา อนุมัติ หรือปิดโพสต์ได้ที่หน้าจัดการ</p>
        <Button asChild className="h-10 px-4">
          <Link to={`/my-pets/${pet.id}`}>ไปหน้าจัดการ</Link>
        </Button>
      </Notice>
    )
  } else if (pet.status === 'adopted') {
    content = (
      <Notice icon={<HomeIcon className="size-6" aria-hidden />} title="น้องมีบ้านแล้ว">
        <p className="text-sm text-muted-foreground">ขอบคุณที่สนใจ ลองดูน้องตัวอื่นที่ยังรอบ้านอยู่นะ</p>
      </Notice>
    )
  } else if (pet.status === 'closed') {
    content = (
      <Notice icon={<LockIcon className="size-6" aria-hidden />} title="ประกาศนี้ปิดรับแล้ว">
        <p className="text-sm text-muted-foreground">เจ้าของปิดรับคำขอสำหรับน้องตัวนี้แล้ว</p>
      </Notice>
    )
  } else if (status === 'checking') {
    content = (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  } else if (status === 'anonymous') {
    content = (
      <Notice icon={<LockIcon className="size-6" aria-hidden />} title="เข้าสู่ระบบเพื่อยื่นคำขอ">
        <p className="text-sm text-muted-foreground">ต้องมีบัญชีก่อนจึงจะยื่นขอรับเลี้ยงน้องได้</p>
        <Button asChild className="h-10 px-4">
          <Link to={loginPath(location.pathname + location.search)}>เข้าสู่ระบบ</Link>
        </Button>
      </Notice>
    )
  } else {
    content = <ApplyForm petId={pet.id} petName={pet.name} />
  }

  return (
    <section aria-labelledby="adopt-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 id="adopt-heading" className="mb-4 text-lg font-semibold">
        ขอรับเลี้ยง {pet.name}
      </h2>
      {content}
    </section>
  )
}
