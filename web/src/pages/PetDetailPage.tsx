import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdoptionPanel } from '@/features/pets/AdoptionPanel'
import { PetImage } from '@/features/pets/PetImage'
import { PetStatusBadge } from '@/features/pets/PetStatusBadge'
import { SaveButton } from '@/features/pets/SaveButton'
import { usePet } from '@/features/pets/use-pet'
import { isNotFoundError } from '@/lib/api/errors'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge, formatDate } from '@/lib/format'

const BACK_LABEL = 'กลับไปดูน้อง ๆ ทั้งหมด'

function BackLink() {
  const navigate = useNavigate()
  // มีประวัติในแอป (เช่นมาจากหน้ารายการพร้อม filter) → ย้อนกลับเพื่อรักษา filter/หน้าเดิม, ไม่งั้นไปหน้ารายการ
  const canGoBack = (window.history.state as { idx?: number } | null)?.idx ? true : false
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 mb-6 rounded-full px-2 text-muted-foreground"
      onClick={() => (canGoBack ? navigate(-1) : navigate('/pets'))}
    >
      <ArrowLeftIcon aria-hidden />
      {BACK_LABEL}
    </Button>
  )
}

// รายการข้อมูลหลัก: 2 คอลัมน์ (ป้าย / ค่า) คั่นแต่ละแถวด้วยเส้นบาง ไม่มีกล่อง
// แสดงเฉพาะฟิลด์ที่ API มีจริง (ไม่มีเพศ/ขนาดใน Pet จึงไม่แสดง)
function FactList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="border-b">
      {items.map(({ label, value }) => (
        <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-t py-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* max-w-prose คุมความยาวบรรทัด · pre-line รักษาการขึ้นบรรทัดของเจ้าของโพสต์ · break-words กันข้อความยาวล้นจอมือถือ */}
      <p className="max-w-prose whitespace-pre-line break-words leading-relaxed">{text}</p>
    </section>
  )
}

// โครงเดียวกับหน้าจริง: รูป 4:3 โค้ง 24px ซ้าย + ชื่อ / รายการ / ย่อหน้าขวา
function PetDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12" aria-busy="true" aria-label="กำลังโหลดข้อมูลสัตว์">
      <Skeleton className="aspect-[4/3] w-full rounded-[1.5rem] bg-muted" />
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2 bg-muted" />
        <Skeleton className="h-10 w-32 rounded-full bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full bg-muted" />
          ))}
        </div>
        <Skeleton className="h-28 w-full bg-muted" />
      </div>
    </div>
  )
}

// หน้ารายละเอียดสัตว์ — ดูได้โดยไม่ต้อง login
export function PetDetailPage() {
  const { id = '' } = useParams()
  const query = usePet(id)

  if (query.isPending) {
    return (
      <div>
        <BackLink />
        <PetDetailSkeleton />
      </div>
    )
  }

  if (query.isError) {
    // 404 หรือ id ผิดรูปแบบ (API ตอบ 400) → "ไม่พบข้อมูล" แทน error ทางเทคนิค
    if (isNotFoundError(query.error)) {
      return (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ไม่พบข้อมูลสัตว์ตัวนี้"
          description="ลิงก์อาจไม่ถูกต้อง หรือประกาศนี้ไม่มีอยู่แล้ว"
          action={
            <Button asChild variant="outline" className="rounded-full border-field-border/50 bg-card px-6">
              <Link to="/pets">{BACK_LABEL}</Link>
            </Button>
          }
        />
      )
    }
    return (
      <div>
        <BackLink />
        <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
      </div>
    )
  }

  const pet = query.data
  const facts = [
    { label: 'ชนิด', value: SPECIES_LABELS[pet.species] },
    { label: 'อายุ', value: formatAge(pet.age_months) },
    { label: 'จังหวัด', value: pet.province },
    { label: 'ลงประกาศเมื่อ', value: formatDate(pet.created_at) },
  ].filter((f) => f.value && f.value !== '-') // ฟิลด์ที่ไม่มีค่า → ซ่อน (formatDate คืน '-' เมื่อวันที่ใช้ไม่ได้)

  return (
    <div>
      <BackLink />
      {/* จอใหญ่: ซ้าย = รูปใหญ่ (sticky เพราะคอลัมน์ขวายาวกว่าจอ ถ้าให้ขวา sticky จะเลื่อนไม่ถึงท้ายฟอร์ม)
          ขวา = ข้อมูล → คำอธิบาย → เงื่อนไข → กล่องรับเลี้ยง
          มือถือ: เรียงตามลำดับเดียวกัน รูป → ชื่อ → ข้อมูล → คำอธิบาย → ฟอร์ม */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
        {/* เข้าหน้า: รูปเฟดเข้า แล้วคอลัมน์ข้อมูลเฟดขึ้นตามหลัง 120ms (เล่นครั้งเดียวตอนสถานะโหลดสำเร็จ mount · refetch ไม่ remount) */}
        <div className="aspect-[4/3] animate-fade-in overflow-hidden rounded-[1.5rem] bg-muted lg:sticky lg:top-24">
          <PetImage src={pet.image_url} alt={pet.name} species={pet.species} className="object-[center_30%]" />
        </div>

        <div className="min-w-0 animate-enter space-y-8 [animation-delay:120ms]">
          <div className="space-y-4">
            {/* ป้ายสถานะเฉพาะเมื่อต่างจากปกติ (มีบ้านแล้ว / ปิดรับ) เหมือนการ์ดในหน้ารายการ */}
            {pet.status !== 'available' && <PetStatusBadge status={pet.status} />}
            <h1 className="break-words text-3xl font-bold sm:text-4xl">{pet.name}</h1>
            <SaveButton petId={pet.id} className="rounded-full border-field-border/50 bg-card px-5" />
          </div>

          <FactList items={facts} />

          {pet.description.trim() && <TextSection title="เกี่ยวกับน้อง" text={pet.description} />}
          {pet.requirements.trim() && <TextSection title="เงื่อนไขการรับเลี้ยง" text={pet.requirements} />}

          <AdoptionPanel pet={pet} />
        </div>
      </div>
    </div>
  )
}
