import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { HomeIcon, LockIcon, SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplyForm } from '@/features/applications/ApplyForm'
import { useAuth } from '@/features/auth/auth-context'
import { loginPath } from '@/features/auth/redirect'
import type { Pet } from '@/lib/types'

// ข้อความแทนฟอร์ม: ไอคอนเส้นบางในวงเทาอ่อน + หัวข้อ + คำอธิบาย + ปุ่ม (ชิดซ้ายให้ตรงกับคอลัมน์ข้อมูล)
function Notice({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="font-semibold">{title}</p>
      {children}
    </div>
  )
}

const PILL = 'mt-1 rounded-full px-6'

// มีบ้านแล้ว/ปิดรับ: พาไปดูน้องตัวอื่น (ลิงก์นำทางเท่านั้น)
function OtherPetsLink() {
  return (
    <Button asChild variant="outline" className={`${PILL} border-field-border/50 bg-card`}>
      <Link to="/pets">ดูน้องตัวอื่น</Link>
    </Button>
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
      <Notice icon={<SettingsIcon className="size-5" strokeWidth={1.5} aria-hidden />} title="นี่คือโพสต์ของคุณ">
        <p className="text-muted-foreground">ดูคำขอที่เข้ามา อนุมัติ หรือปิดโพสต์ได้ที่หน้าจัดการ</p>
        <Button asChild className={PILL}>
          <Link to={`/my-pets/${pet.id}`}>ไปหน้าจัดการ</Link>
        </Button>
      </Notice>
    )
  } else if (pet.status === 'adopted') {
    content = (
      <Notice icon={<HomeIcon className="size-5" strokeWidth={1.5} aria-hidden />} title="น้องมีบ้านแล้ว">
        <p className="text-muted-foreground">ขอบคุณที่สนใจ ลองดูน้องตัวอื่นที่ยังรอบ้านอยู่นะ</p>
        <OtherPetsLink />
      </Notice>
    )
  } else if (pet.status === 'closed') {
    content = (
      <Notice icon={<LockIcon className="size-5" strokeWidth={1.5} aria-hidden />} title="ประกาศนี้ปิดรับแล้ว">
        <p className="text-muted-foreground">เจ้าของปิดรับคำขอสำหรับน้องตัวนี้แล้ว</p>
        <OtherPetsLink />
      </Notice>
    )
  } else if (status === 'checking') {
    content = (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-5 w-1/2 bg-muted" />
        <Skeleton className="h-10 w-full bg-muted" />
        <Skeleton className="h-24 w-full bg-muted" />
      </div>
    )
  } else if (status === 'anonymous') {
    content = (
      <Notice icon={<LockIcon className="size-5" strokeWidth={1.5} aria-hidden />} title="เข้าสู่ระบบเพื่อส่งคำขอ">
        <p className="text-muted-foreground">ต้องมีบัญชีก่อนจึงจะส่งคำขอรับเลี้ยงน้องได้ ดูข้อมูลน้องได้ตามปกติโดยไม่ต้องเข้าสู่ระบบ</p>
        <Button asChild className={PILL}>
          <Link to={loginPath(location.pathname + location.search)}>เข้าสู่ระบบ</Link>
        </Button>
      </Notice>
    )
  } else {
    content = <ApplyForm petId={pet.id} petName={pet.name} />
  }

  return (
    // การ์ดตาม DESIGN.md: ขอบ 1px โค้ง 20px ไม่มีเงา — จุดตัดสินใจจุดเดียวของหน้า (ปุ่มหลักสีเดียวในกล่องนี้)
    <section aria-labelledby="adopt-heading" className="rounded-[1.25rem] border bg-card p-6 lg:p-8">
      <h2 id="adopt-heading" className="mb-5 text-xl font-semibold">
        ขอรับเลี้ยง {pet.name}
      </h2>
      {content}
    </section>
  )
}
