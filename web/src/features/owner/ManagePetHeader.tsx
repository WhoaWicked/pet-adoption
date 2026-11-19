import { Link } from 'react-router'
import { ExternalLinkIcon, LockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PetImage } from '@/features/pets/PetImage'
import { PetStatusBadge } from '@/features/pets/PetStatusBadge'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'

// สรุปข้อมูลสัตว์ด้านบนหน้าจัดการ + ปุ่มปิดโพสต์ (แสดงเฉพาะตอนยังเปิดรับ)
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
    <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
        <PetImage src={pet.image_url} alt={pet.name} species={pet.species} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">{pet.name}</h1>
          <PetStatusBadge status={pet.status} />
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{SPECIES_LABELS[pet.species]}</span>
          <span>{formatAge(pet.age_months)}</span>
          <span>{pet.province}</span>
        </p>
        <Link
          to={`/pets/${pet.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ดูหน้าประกาศ
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
      {pet.status === 'available' && (
        <Button variant="outline" className="shrink-0" onClick={onClose} disabled={disabled}>
          <LockIcon aria-hidden />
          ปิดโพสต์
        </Button>
      )}
    </section>
  )
}
