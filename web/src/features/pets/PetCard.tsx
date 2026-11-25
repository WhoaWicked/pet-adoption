import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { SPECIES_LABELS } from '@/lib/constants/labels'
import { formatAge } from '@/lib/format'
import type { Pet } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PetImage } from './PetImage'
import { PetStatusBadge } from './PetStatusBadge'
import { SaveButton } from './SaveButton'

// การ์ดสัตว์ (ใช้ซ้ำในหน้ารายการ, ที่บันทึกไว้, สัตว์ของฉัน)
// รูป 4:5 เป็นพระเอก ข้อความใต้รูปสั้น ๆ ไม่มีกล่อง/พื้นหลังรอบการ์ด
// - hideAvailable: ไม่แสดงป้าย "รอบ้าน" (หน้าที่ทุกตัวรอบ้านอยู่แล้ว) — สถานะอื่นยังแสดง
// - showSave: ปุ่มหัวใจวงกลมขาวมุมขวาบนของรูป (วางนอกลิงก์ เพราะปุ่มซ้อนในลิงก์ไม่ได้)
// data-slot="pet-photo": ให้กริดของหน้าขยายรูปการ์ดใบแรกเป็น 2x2 ได้ด้วย CSS
export function PetCard({
  pet,
  to = `/pets/${pet.id}`,
  hideAvailable = false,
  showSave = false,
}: {
  pet: Pet
  to?: string
  hideAvailable?: boolean
  showSave?: boolean
}) {
  const showStatus = !(hideAvailable && pet.status === 'available')

  return (
    <div className="group relative flex h-full flex-col">
      <Link
        to={to}
        className="flex flex-1 flex-col gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div data-slot="pet-photo" className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          {/* hover: รูปซูมช้า ๆ ภายในกรอบ — ปิดเมื่อผู้ใช้ตั้ง reduced-motion */}
          <PetImage
            src={pet.image_url}
            alt={pet.name}
            species={pet.species}
            className="object-[center_30%] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
          />
          {showStatus && <PetStatusBadge status={pet.status} className="absolute bottom-3 left-3" />}
        </div>
        <div className={cn('space-y-0.5', showSave && 'pr-1')}>
          <h3 className="truncate text-base font-semibold" title={pet.name}>
            {pet.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABELS[pet.species]} · {formatAge(pet.age_months)} · {pet.province}
          </p>
        </div>
      </Link>
      {showSave && <SaveButton petId={pet.id} variant="icon" className="absolute top-3 right-3" />}
    </div>
  )
}

export function PetCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      <Skeleton data-slot="pet-photo" className="aspect-[4/5] rounded-xl bg-muted" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
      </div>
    </div>
  )
}
