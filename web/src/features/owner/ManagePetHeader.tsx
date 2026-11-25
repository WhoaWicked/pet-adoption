import { Link } from 'react-router'
import { ExternalLinkIcon, LockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PetImage } from '@/features/pets/PetImage'
import { PetStatusBadge } from '@/features/pets/PetStatusBadge'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'

// ข้อมูลสัตว์แบบกะทัดรัดด้านบนหน้าจัดการ (ไม่มีกล่อง คั่นด้วยเส้นล่างบาง) + ปุ่มปิดโพสต์ (แสดงเฉพาะตอนยังเปิดรับ)
export function ManagePetHeader({
  pet,
  onClose,
  disabled,
}: {
  pet: Pet
  onClose: () => void
  disabled: boolean
}) {
  return (
    <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          <PetImage src={pet.image_url} alt={pet.name} species={pet.species} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="break-words text-2xl font-bold sm:text-3xl">{pet.name}</h1>
            <PetStatusBadge status={pet.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABELS[pet.species]} · {formatAge(pet.age_months)} · {pet.province}
          </p>
          <Link
            to={`/pets/${pet.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            ดูหน้าประกาศ
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
      {pet.status === 'available' && (
        <Button
          variant="outline"
          className="shrink-0 rounded-full border-field-border/50 bg-card px-5"
          onClick={onClose}
          disabled={disabled}
        >
          <LockIcon aria-hidden />
          ปิดโพสต์
        </Button>
      )}
    </section>
  )
}
