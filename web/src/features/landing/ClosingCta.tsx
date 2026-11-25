import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Reveal } from './Reveal'

// ส่วนปิดท้าย: จัดกลาง โล่ง ๆ ชวนฝั่งคนที่มีน้องต้องหาบ้าน (ฝั่งคนรับเลี้ยงถูกชวนไปแล้วใน hero)
export function ClosingCta() {
  return (
    <section aria-labelledby="closing-heading" className="py-20 text-center lg:py-32">
      <Reveal>
        <h2 id="closing-heading" className="text-3xl leading-[1.3] font-bold sm:text-4xl lg:text-5xl">
          {/* 2 บรรทัดบนจอกว้าง · จอแคบตัดเพิ่มได้เฉพาะรอยต่อวลี (inline-block) */}
          <span className="block">
            <span className="inline-block">มีน้องที่กำลัง</span>
            <span className="inline-block">หาบ้านใหม่อยู่ไหม</span>
          </span>
          <span className="block">
            <span className="inline-block">ลงประกาศ</span>
            <span className="inline-block">ให้คนที่พร้อมได้เห็น</span>
          </span>
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full px-6">
            <Link to="/pets/new">ลงประกาศหาบ้านให้น้อง</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-field-border/50 bg-card px-6">
            <Link to="/pets">ดูน้อง ๆ ทั้งหมด</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
