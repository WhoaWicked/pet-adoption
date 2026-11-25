import { Link } from 'react-router'
import { PawPrintIcon, PlusIcon } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import type { Paged, Pet } from '@/lib/types'

export const LATEST_PETS_COUNT = 4

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4'

// "น้อง ๆ ที่รอบ้าน": 4 ตัวล่าสุด ใช้ PetCard เดิม + state โหลด/ว่าง/ผิดพลาด
export function LatestPets({ query, pets }: { query: UseQueryResult<Paged<Pet>>; pets: Pet[] }) {
  let content
  if (query.isPending) {
    content = (
      <div className={GRID_CLASS} aria-busy="true" aria-label="กำลังโหลดรายการสัตว์">
        {Array.from({ length: LATEST_PETS_COUNT }, (_, i) => (
          <PetCardSkeleton key={i} />
        ))}
      </div>
    )
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  } else if (pets.length === 0) {
    content = (
      <EmptyState
        icon={<PawPrintIcon className="size-7" aria-hidden />}
        title="ยังไม่มีน้องรอบ้านตอนนี้"
        description="ถ้าคุณมีน้องที่กำลังหาบ้านใหม่ ลงประกาศได้เลย"
        action={
          <Button asChild>
            <Link to="/pets/new">
              <PlusIcon aria-hidden />
              ลงประกาศหาบ้านให้น้อง
            </Link>
          </Button>
        }
      />
    )
  } else {
    content = (
      <div className={GRID_CLASS}>
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} hideAvailable showSave />
        ))}
      </div>
    )
  }

  return (
    <section aria-labelledby="latest-pets-heading" className="py-16 lg:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 id="latest-pets-heading" className="text-3xl font-bold sm:text-4xl">
            น้อง ๆ ที่รอบ้าน
          </h2>
          <p className="text-muted-foreground">ประกาศล่าสุดที่ยังเปิดรับคำขอ</p>
        </div>
        <Link
          to="/pets"
          className="shrink-0 rounded-sm font-semibold text-primary outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ดูทั้งหมด
        </Link>
      </div>
      {content}
    </section>
  )
}
