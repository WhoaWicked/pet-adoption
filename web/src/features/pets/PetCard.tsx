import { Link } from 'react-router'
import { MapPinIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'
import { PetImage } from './PetImage'
import { PetStatusBadge } from './PetStatusBadge'

// การ์ดสัตว์ (ใช้ซ้ำในหน้ารายการ, ที่บันทึกไว้, สัตว์ของฉัน) — ทั้งการ์ดเป็นลิงก์ไปหน้ารายละเอียด
export function PetCard({ pet, to = `/pets/${pet.id}` }: { pet: Pet; to?: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PetImage
          src={pet.image_url}
          alt={pet.name}
          species={pet.species}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <PetStatusBadge status={pet.status} className="absolute top-3 left-3 shadow-xs" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="truncate text-lg font-semibold" title={pet.name}>
          {pet.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {SPECIES_LABELS[pet.species]} · {formatAge(pet.age_months)}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-1 text-sm text-muted-foreground">
          <MapPinIcon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{pet.province}</span>
        </p>
      </div>
    </Link>
  )
}

export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
