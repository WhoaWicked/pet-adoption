import { Link } from 'react-router'
import { PawPrintIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PetImage } from '@/features/pets/PetImage'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'

// ส่วนต้อนรับ: ข้อความซ้าย รูปน้องตัวจริงขวา (มือถือ: ข้อความบน รูปล่าง)
// พื้นทรายอุ่นยืดเต็มจอด้วย box-shadow + clip-path (ไม่ทำให้หน้าล้นแนวนอน)
// -mt ชดเชย padding บนของ <main> ให้แถบชนใต้ header พอดี
export function LandingHero({ pet, isLoading }: { pet: Pet | undefined; isLoading: boolean }) {
  return (
    <section className="-mt-8 bg-hero py-12 shadow-[0_0_0_100vmax_var(--color-hero)] [clip-path:inset(0_-100vmax)] sm:-mt-10 sm:py-16 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16">
        <div>
          {/* ภาษาไทยไม่มีเว้นวรรค → แบ่งวลีเป็น inline-block ให้ตัดบรรทัดตรงรอยต่อวลี ไม่ใช่กลางคำ */}
          <h1 className="text-5xl leading-[1.1] font-bold sm:text-6xl lg:text-7xl">
            <span className="inline-block">ให้น้อง</span>
            <span className="inline-block">ได้มีบ้าน</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground sm:text-xl">
            ดูโปรไฟล์น้องที่เจ้าของกำลังหาบ้านใหม่ให้ ถูกใจตัวไหนก็ส่งคำขอรับเลี้ยงได้จากหน้าของน้องเลย
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/pets">ดูน้อง ๆ ทั้งหมด</Link>
            </Button>
            {/* /pets/new อยู่ใต้ RequireAuth อยู่แล้ว: ยังไม่ login จะถูกพาไป login แล้วกลับมาหน้านี้เอง */}
            <Button asChild size="lg" variant="outline">
              <Link to="/pets/new">ลงประกาศหาบ้านให้น้อง</Link>
            </Button>
          </div>
        </div>

        <HeroPhoto pet={pet} isLoading={isLoading} />
      </div>
    </section>
  )
}

const PHOTO_FRAME = 'relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-[3/2] lg:aspect-[4/5]'

function HeroPhoto({ pet, isLoading }: { pet: Pet | undefined; isLoading: boolean }) {
  if (isLoading) return <Skeleton className={`${PHOTO_FRAME} bg-muted`} aria-hidden />

  // ยังไม่มีน้องในระบบ หรือโหลดไม่สำเร็จ: กรอบว่างพร้อมไอคอนจาง ๆ (ไม่ใช้รูปสต็อก/ข้อมูลปลอม)
  if (!pet) {
    return (
      <div className={`${PHOTO_FRAME} flex items-center justify-center text-muted-foreground/35`} aria-hidden>
        <PawPrintIcon className="size-16" strokeWidth={1.25} />
      </div>
    )
  }

  // ทั้งรูปเป็นลิงก์ไปหน้าน้อง · ใต้รูปบอกว่าเป็นใคร (ข้อมูลจริงจาก API)
  return (
    <Link
      to={`/pets/${pet.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-hero"
    >
      <figure>
        <div className={PHOTO_FRAME}>
          <PetImage
            src={pet.image_url}
            alt={pet.name}
            species={pet.species}
            className="object-[center_30%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
        <figcaption className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground group-hover:text-primary">{pet.name}</span>
          {` อายุ ${formatAge(pet.age_months)} อยู่${pet.province} กำลังรอบ้าน`}
        </figcaption>
      </figure>
    </Link>
  )
}
