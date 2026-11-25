import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { PetImage } from '@/features/pets/PetImage'
import type { Pet } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Reveal } from './Reveal'

export const SHOWCASE_COUNT = 3

// คอลัมน์ตามจำนวนรูปที่มีจริง (มีน้องที่มีรูปไม่ถึง 3 ตัวก็ยังจัดเต็มกรอบได้) — ช่องกลางกว้างกว่าเมื่อมี 3 รูป
const COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-[1fr_1.35fr_1fr]',
}

// ความสูงรูปเท่ากันทุกช่องตั้งแต่ sm · มือถือแสดงรูปเดียวแบบ 4:3
const PHOTO = 'aspect-[4/3] overflow-hidden rounded-[1rem] bg-muted sm:aspect-auto sm:h-72 lg:h-[26rem]'

// กรอบรูปใหญ่ใต้ hero: ขอบโค้ง 24px เส้น 1px · รูปน้องจริงจาก API พร้อมชื่อ/จังหวัดกำกับ
// มือถือแสดงแค่รูปแรก (3 รูปบนจอแคบจะเล็กจนดูไม่ออก)
export function PhotoShowcase({ pets, isLoading }: { pets: Pet[]; isLoading: boolean }) {
  // ไม่มีน้องที่มีรูป หรือโหลดไม่สำเร็จ → ไม่แสดงส่วนนี้เลย (ไม่ใช้รูปสต็อก ไม่โชว์กรอบว่าง)
  if (!isLoading && pets.length === 0) return null

  const count = isLoading ? SHOWCASE_COUNT : pets.length

  return (
    <Reveal>
      <div className="rounded-[1.5rem] border bg-card p-2 sm:p-3">
        <ul className={cn('grid gap-3', COLUMNS[count])}>
          {isLoading
            ? Array.from({ length: SHOWCASE_COUNT }, (_, i) => (
                <li key={i} className={cn(i > 0 && 'hidden sm:block')} aria-hidden>
                  <Skeleton className={cn(PHOTO, 'bg-muted')} />
                  <Skeleton className="mt-3 mb-1 ml-1 h-4 w-1/3 bg-muted" />
                </li>
              ))
            : pets.map((pet, i) => (
                <li key={pet.id} className={cn(i > 0 && 'hidden sm:block')}>
                  <Link
                    to={`/pets/${pet.id}`}
                    className="group block rounded-[1rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className={PHOTO}>
                      <PetImage
                        src={pet.image_url}
                        alt={pet.name}
                        species={pet.species}
                        className="object-[center_30%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="px-1 pt-2.5 pb-1 text-sm">
                      <span className="font-semibold group-hover:text-primary">{pet.name}</span>
                      <span className="text-muted-foreground"> จาก{pet.province}</span>
                    </p>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </Reveal>
  )
}
