import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// ส่วนต้อนรับ: จัดกลาง โล่ง ๆ — หัวข้อ 2 บรรทัด, คำอธิบายสีเทา, ปุ่มหลักแคปซูล + ลิงก์รอง
// ไม่มีแถบพื้นสี/badge ให้กรอบรูปที่อยู่ถัดลงไปเป็นตัวเด่นแทน
export function LandingHero() {
  return (
    <section className="mx-auto max-w-3xl py-14 text-center sm:py-20 lg:py-28">
      {/* แต่ละบรรทัดเป็น block → ตัดบรรทัดตรงรอยต่อวลีเสมอ (ภาษาไทยไม่มีเว้นวรรคให้เบราว์เซอร์ตัด) */}
      <h1 className="text-4xl leading-[1.3] font-bold sm:text-5xl lg:text-6xl">
        <span className="block">ให้น้องได้มีบ้าน</span>
        <span className="block">ที่รักและพร้อมดูแล</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        ดูโปรไฟล์น้องหมา น้องแมว และสัตว์อื่น ๆ ที่เจ้าของกำลังหาบ้านใหม่ให้
        ถูกใจตัวไหนก็ส่งคำขอรับเลี้ยงได้จากหน้าของน้องเลย
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
        <Button asChild className="rounded-full px-6">
          <Link to="/pets">ดูน้อง ๆ ทั้งหมด</Link>
        </Button>
        {/* /pets/new อยู่ใต้ RequireAuth อยู่แล้ว: ยังไม่ login จะถูกพาไป login แล้วกลับมาที่หน้าลงประกาศเอง */}
        <Link
          to="/pets/new"
          className="rounded-sm font-semibold text-primary underline-offset-[6px] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ลงประกาศหาบ้านให้น้อง
        </Link>
      </div>
    </section>
  )
}
