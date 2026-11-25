import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { PetImage } from '@/features/pets/PetImage'
import type { Pet } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLUMN_COUNT = 3
const MIN_PER_COLUMN = 4 // ให้แต่ละคอลัมน์สูงกว่ากรอบเสมอ ไม่เห็นช่องว่างตอนวน

// ทิศและความเร็วของแต่ละคอลัมน์: 1 ขึ้น · 2 ลง · 3 ขึ้น (เร็วต่างกันเล็กน้อยไม่ให้ดูซิงก์กัน) · คอลัมน์ 3 ซ่อนบนมือถือ (เหลือ 2 คอลัมน์)
const COLUMNS = [
  { animation: 'animate-scroll-up', duration: '48s', className: '' },
  { animation: 'animate-scroll-down', duration: '56s', className: '' },
  { animation: 'animate-scroll-up', duration: '52s', className: 'hidden sm:block' },
]

// ความสูงคงที่ของช่องแสดงผล + mask จางขอบบน/ล่าง (mask ใช้ซ่อนขอบ ไม่ใช่สีไล่ตกแต่ง)
const VIEWPORT =
  'relative h-[26rem] overflow-hidden rounded-[1rem] sm:h-[30rem] lg:h-[34rem] [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]'

/** กระจายรูปลง 3 คอลัมน์แบบ round-robin · ถ้าน้อยไป ทำซ้ำรายการจนแต่ละคอลัมน์มีอย่างน้อย 4 รูป */
function toColumns(pets: Pet[]): Pet[][] {
  const filled: Pet[] = []
  while (filled.length < COLUMN_COUNT * MIN_PER_COLUMN) filled.push(...pets)
  return COLUMNS.map((_, c) => filled.filter((_, i) => i % COLUMN_COUNT === c))
}

// รูป 1 ใบ: สัดส่วน 4:5 คงที่ (กัน CLS) · ระยะห่างใช้ padding ล่าง (ไม่ใช้ gap) ให้การเลื่อน -50% ต่อรอยพอดี
// ชุดแรกเป็นลิงก์ไปหน้าน้อง · ชุดซ้ำเป็น div ธรรมดา (ไม่มีลิงก์/โฟกัสซ้ำ)
function Tile({ pet, asLink }: { pet: Pet; asLink: boolean }) {
  const body = (
    <>
      <div className="aspect-[4/5] overflow-hidden rounded-[1rem] bg-muted">
        <PetImage src={pet.image_url} alt={asLink ? pet.name : ''} species={pet.species} className="object-[center_30%]" />
      </div>
      <p className="truncate px-1 pt-1.5 text-xs text-muted-foreground">{pet.name}</p>
    </>
  )
  return asLink ? (
    <Link to={`/pets/${pet.id}`} className="block rounded-[1rem] pb-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {body}
    </Link>
  ) : (
    <div className="pb-3">{body}</div>
  )
}

// กรอบรูปใต้ hero: คอลัมน์รูปน้องจริงเลื่อนแนวตั้งวนไม่สิ้นสุด สลับทิศกัน (CSS keyframes ล้วน)
// - ชี้เมาส์หรือโฟกัสลิงก์ในกรอบ → หยุดเลื่อน
// - เลื่อนเสมอ แม้ผู้ใช้ตั้ง prefers-reduced-motion (ตัดสินใจโดยเจ้าของโปรเจกต์) — หยุดได้ด้วยการชี้เมาส์/โฟกัส
export function PhotoShowcase({ pets, isLoading }: { pets: Pet[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border bg-card p-2 sm:p-3" aria-busy="true" aria-label="กำลังโหลดรูปน้อง ๆ">
        <div className={cn(VIEWPORT, 'grid grid-cols-2 gap-3 sm:grid-cols-3')}>
          {COLUMNS.map((col, c) => (
            <div key={c} className={cn('space-y-3', col.className)}>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-[1rem] bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ไม่มีน้องที่มีรูป หรือโหลดไม่สำเร็จ → ไม่แสดงส่วนนี้ (ไม่มีกรอบว่าง)
  // ส่วน "น้อง ๆ ที่รอบ้าน" ถัดลงไปแสดงสถานะว่าง/error พร้อมปุ่มลองใหม่อยู่แล้ว
  if (pets.length === 0) return null

  const columns = toColumns(pets)

  return (
    <section aria-label="รูปน้อง ๆ ที่กำลังรอบ้าน" className="group rounded-[1.5rem] border bg-card p-2 sm:p-3">
      <div className={cn(VIEWPORT, 'grid grid-cols-2 gap-3 sm:grid-cols-3')}>
        {columns.map((items, c) => (
          <div key={c} className={COLUMNS[c].className}>
            {/* track = ชุดจริง + ชุดซ้ำ · หยุดเมื่อชี้เมาส์/โฟกัสในกรอบ · เลื่อนเสมอ (ไม่ขึ้นกับ prefers-reduced-motion) */}
            <div
              style={{ animationDuration: COLUMNS[c].duration }}
              className={cn(
                COLUMNS[c].animation,
                'group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
              )}
            >
              <div>
                {items.map((pet, i) => (
                  <Tile key={i} pet={pet} asLink />
                ))}
              </div>
              <div aria-hidden>
                {items.map((pet, i) => (
                  <Tile key={i} pet={pet} asLink={false} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
