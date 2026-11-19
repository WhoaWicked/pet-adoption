import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, CakeIcon, MapPinIcon, PawPrintIcon, SearchXIcon } from 'lucide-react'
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
import { formatAge } from '@/lib/format'

function BackLink() {
  const navigate = useNavigate()
  // มีประวัติในแอป (เช่นมาจากหน้ารายการพร้อม filter) → ย้อนกลับเพื่อรักษา filter/หน้าเดิม, ไม่งั้นไปหน้าแรก
  const canGoBack = (window.history.state as { idx?: number } | null)?.idx ? true : false
  return (
    <Button variant="ghost" className="-ml-2 mb-4 h-9 px-2 text-muted-foreground" onClick={() => (canGoBack ? navigate(-1) : navigate('/'))}>
      <ArrowLeftIcon aria-hidden />
      กลับไปดูน้อง ๆ
    </Button>
  )
}

function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* pre-line รักษาการขึ้นบรรทัดของเจ้าของโพสต์, break-words กันข้อความยาวไม่มีช่องว่างล้นจอมือถือ */}
      <p className="whitespace-pre-line break-words text-muted-foreground">{text}</p>
    </section>
  )
}

function PetDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2" aria-busy="true" aria-label="กำลังโหลดข้อมูลสัตว์">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-32 w-full" />
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
            <Button asChild variant="outline" className="h-10 px-4">
              <Link to="/">กลับไปดูน้อง ๆ</Link>
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

  return (
    <div>
      <BackLink />
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-card">
          <PetImage src={pet.image_url} alt={pet.name} species={pet.species} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            <PetStatusBadge status={pet.status} />
            <h1 className="break-words text-3xl font-bold tracking-tight">{pet.name}</h1>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <PawPrintIcon className="size-4" aria-hidden />
                {SPECIES_LABELS[pet.species]}
              </li>
              <li className="flex items-center gap-1.5">
                <CakeIcon className="size-4" aria-hidden />
                {formatAge(pet.age_months)}
              </li>
              <li className="flex items-center gap-1.5">
                <MapPinIcon className="size-4" aria-hidden />
                {pet.province}
              </li>
            </ul>
            <SaveButton petId={pet.id} />
          </div>

          <TextSection title="เกี่ยวกับน้อง" text={pet.description} />
          <TextSection title="เงื่อนไขการรับเลี้ยง" text={pet.requirements} />
          <AdoptionPanel pet={pet} />
        </div>
      </div>
    </div>
  )
}
