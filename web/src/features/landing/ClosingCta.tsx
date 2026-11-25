import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// ส่วนปิดท้าย: ชวนคนที่มีน้องต้องหาบ้านให้ลงประกาศ (ฝั่งคนรับเลี้ยงถูกชวนไปแล้วใน hero)
// พื้นทรายอุ่นเต็มจอแบบเดียวกับ hero · -mb ชดเชย padding ล่างของ <main> ให้แถบชน footer ของ AppLayout พอดี
export function ClosingCta() {
  return (
    <section
      aria-labelledby="closing-heading"
      className="-mb-8 bg-hero py-16 shadow-[0_0_0_100vmax_var(--color-hero)] [clip-path:inset(0_-100vmax)] sm:-mb-10 lg:py-24"
    >
      <div className="max-w-2xl">
        <h2 id="closing-heading" className="text-3xl font-bold sm:text-4xl">
          <span className="inline-block">มีน้องที่กำลัง</span>
          <span className="inline-block">หาบ้านใหม่อยู่ไหม</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          ลงประกาศพร้อมรูปและรายละเอียดของน้อง แล้วเลือกบ้านที่ใช่จากคำขอที่ส่งเข้ามาได้ด้วยตัวเอง
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/pets/new">ลงประกาศหาบ้านให้น้อง</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/pets">ดูน้อง ๆ ทั้งหมด</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
