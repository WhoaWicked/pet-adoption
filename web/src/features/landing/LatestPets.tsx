import { Link } from 'react-router'
import { PawPrintIcon, PlusIcon } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import type { Paged, Pet } from '@/lib/types'
import { Reveal } from './Reveal'

export const LATEST_PETS_COUNT = 4

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4'

// "น้อง ๆ ที่รอบ้าน": หัวข้อกลางหน้า + 4 ตัวล่าสุด (PetCard เดิม) + ปุ่ม "ดูทั้งหมด" ใต้กริด
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
          <Button asChild className="rounded-full px-6">
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
      <>
        <div className={GRID_CLASS}>
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} hideAvailable showSave />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="rounded-full border-field-border/50 bg-card px-6">
            <Link to="/pets">ดูทั้งหมด</Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <section aria-labelledby="latest-pets-heading" className="py-20 lg:py-32">
      <Reveal className="mb-10 text-center lg:mb-12">
        <h2 id="latest-pets-heading" className="text-3xl font-bold sm:text-4xl">
          น้อง ๆ ที่รอบ้าน
        </h2>
        <p className="mt-3 text-muted-foreground">ประกาศล่าสุดที่ยังเปิดรับคำขอ</p>
      </Reveal>
      <Reveal>{content}</Reveal>
    </section>
  )
}
