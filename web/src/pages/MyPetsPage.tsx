import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PetImage } from '@/features/pets/PetImage'
import { PetStatusBadge } from '@/features/pets/PetStatusBadge'
import { useMyPets } from '@/features/pets/use-my-pets'
import { entranceDelay, useEntrance } from '@/lib/use-entrance'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge, formatDate } from '@/lib/format'

// แถวเดียวกับหน้า "คำขอของฉัน": จอ md ขึ้นไป รูป+ชื่อ | วันที่ลง | สถานะ | ปุ่ม · มือถือเรียงลง
const ROW = 'flex flex-col gap-3 py-5 md:grid md:grid-cols-[minmax(0,1fr)_10rem_8rem_7.5rem] md:items-center md:gap-6'

function NewPostButton() {
  return (
    <Button asChild className="rounded-full px-6">
      <Link to="/pets/new">
        <PlusIcon aria-hidden />
        ลงประกาศ
      </Link>
    </Button>
  )
}

// ป้ายคำขอรอพิจารณา: พื้น primary ทึบ ให้เด่นกว่าชิปสถานะ · screen reader อ่านข้อความเต็มแทนข้อความย่อ
function PendingCountBadge({ count }: { count: number }) {
  const text = `รอพิจารณา ${count.toLocaleString('th-TH')}`
  return (
    <Badge className="h-6 px-2.5 font-semibold">
      <span aria-hidden>{text}</span>
      <span className="sr-only">{text} ใบสมัคร</span>
    </Badge>
  )
}

// หน้า "สัตว์ของฉัน" — ทุกสถานะ เป็นรายการแถว (ไม่มีกล่อง คั่นด้วยเส้นบาง) กด "จัดการ" ไปหน้าจัดการคำขอ
export function MyPetsPage() {
  const query = useMyPets()
  // แถวเข้าแบบ stagger เฉพาะตอนโหลดครั้งแรกของหน้า
  const entrance = useEntrance(query.isSuccess)
  const pets = query.data ?? []

  let content
  if (query.isPending) {
    content = (
      <ul className="divide-y border-y" aria-busy="true" aria-label="กำลังโหลดสัตว์ของฉัน">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className={ROW}>
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 bg-muted" />
            <Skeleton className="h-6 w-20 rounded-full bg-muted" />
            <span />
          </li>
        ))}
      </ul>
    )
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  } else if (pets.length === 0) {
    content = (
      <EmptyState
        title="ยังไม่ได้ลงประกาศ"
        description="ถ้ามีน้องที่กำลังหาบ้านใหม่ ลงประกาศได้เลย แล้วดูคำขอที่เข้ามาได้ที่หน้านี้"
        action={<NewPostButton />}
      />
    )
  } else {
    content = (
      <ul className="divide-y border-y">
        {pets.map((pet, i) => (
          <li
            key={pet.id}
            className={entrance ? `${ROW} animate-enter` : ROW}
            style={entrance ? { animationDelay: `${entranceDelay(i)}ms` } : undefined}
          >
            <div className="flex min-w-0 items-center gap-4">
              {/* รูปเล็ก (PetImage เดิม: ไม่มีรูป → ไอคอนตามชนิดสัตว์) */}
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <PetImage src={pet.image_url} alt={pet.name} species={pet.species} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to={`/my-pets/${pet.id}`}
                    className="max-w-full truncate text-lg font-semibold underline-offset-4 hover:text-primary hover:underline"
                  >
                    {pet.name}
                  </Link>
                  {pet.pending_count > 0 && <PendingCountBadge count={pet.pending_count} />}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {SPECIES_LABELS[pet.species]} · {formatAge(pet.age_months)} · {pet.province}
                </p>
              </div>
            </div>

            {/* มือถือ: วันที่ · สถานะ · ปุ่ม อยู่บรรทัดเดียวกัน · จอ md: md:contents ให้แต่ละชิ้นเป็นคอลัมน์ของกริดแถว */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
              <p className="text-sm text-muted-foreground">ลงเมื่อ {formatDate(pet.created_at)}</p>

              {/* หน้านี้สถานะเป็นข้อมูลสำคัญของเจ้าของ จึงแสดงทุกสถานะรวม "รอบ้าน" */}
              <div>
                <PetStatusBadge status={pet.status} />
              </div>

              <div className="ml-auto md:ml-0 md:justify-self-end">
                <Button asChild variant="outline" size="sm" className="rounded-full border-field-border/50 bg-card px-4">
                  <Link to={`/my-pets/${pet.id}`}>จัดการ</Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div>
      <PageHeader
        title="สัตว์ของฉัน"
        description={
          query.isSuccess && pets.length > 0
            ? `ลงประกาศไว้ ${pets.length.toLocaleString('th-TH')} ตัว กด "จัดการ" เพื่อดูคำขอ อนุมัติ หรือปิดโพสต์`
            : 'ประกาศที่คุณลง กดเพื่อดูคำขอ อนุมัติ หรือปิดโพสต์'
        }
        action={pets.length > 0 ? <NewPostButton /> : undefined}
      />
      {content}
    </div>
  )
}
