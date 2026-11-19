import { Link } from 'react-router'
import { CakeIcon, MapPinIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'
import { PetImage } from './PetImage'
import { PetStatusBadge } from './PetStatusBadge'

// การ์ดสัตว์ (ใช้ซ้ำในหน้ารายการ, ที่บันทึกไว้, สัตว์ของฉัน) — ทั้งการ์ดเป็นลิงก์
// รูปเป็นตัวเด่น ไม่มีกรอบรอบการ์ด ข้อความวางบนพื้นหลังหน้าโดยตรง ให้สัตว์เด่นกว่ากล่อง
export function PetCard({ pet, to = `/pets/${pet.id}` }: { pet: Pet; to?: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
        <PetImage src={pet.image_url} alt={pet.name} species={pet.species} />
        {/* hover แค่หรี่รูปเล็กน้อยให้รู้ว่ากดได้ ไม่ขยาย/เด้ง */}
        <span aria-hidden className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/5" />
        <PetStatusBadge status={pet.status} className="absolute top-3 left-3" />
      </div>
      <div className="space-y-1 px-1">
        <h3 className="truncate text-base font-semibold" title={pet.name}>
          {pet.name}
        </h3>
        <p className="text-sm text-muted-foreground">{SPECIES_LABELS[pet.species]}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CakeIcon className="size-3.5 shrink-0" aria-hidden />
            {formatAge(pet.age_months)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{pet.province}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function PetCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
