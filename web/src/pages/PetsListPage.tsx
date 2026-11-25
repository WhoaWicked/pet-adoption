import { useEffect } from 'react'
import { Link } from 'react-router'
import { PlusIcon, SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import { PetFilters } from '@/features/pets/PetFilters'
import { PETS_PAGE_SIZE, usePetFilters } from '@/features/pets/use-pet-filters'
import { usePetsList } from '@/features/pets/use-pets-list'

// กริดการ์ด: มือถือ 2 / แท็บเล็ต 3 / เดสก์ท็อป 4 คอลัมน์ ระยะแนวตั้งมากกว่าแนวนอน
// data-featured=true (หน้าแรก) → บนเดสก์ท็อปการ์ดใบแรกกิน 2x2 และรูปยืดเต็มพื้นที่ (CSS ล้วน ไม่แตะข้อมูล)
const GRID_CLASS = [
  'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-4',
  'lg:data-[featured=true]:*:first:col-span-2 lg:data-[featured=true]:*:first:row-span-2',
  'lg:data-[featured=true]:[&>*:first-child_[data-slot=pet-photo]]:aspect-auto',
  'lg:data-[featured=true]:[&>*:first-child_[data-slot=pet-photo]]:flex-1',
].join(' ')

// หน้า /pets: หัวข้อ + แถบตัวกรอง (sticky) + รายการสัตว์ที่รอบ้าน + pagination (state อยู่ใน URL)
export function PetsListPage() {
  const { filters, setFilter, setPage, clearFilters, hasActiveFilters } = usePetFilters()
  const query = usePetsList(filters)

  // เปลี่ยนหน้าแล้วเลื่อนกลับขึ้นบน
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters.page])

  const total = query.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PETS_PAGE_SIZE))
  const pets = query.data?.data ?? []

  let content
  if (query.isPending) {
    content = (
      <div className={GRID_CLASS} data-featured={filters.page === 1} aria-busy="true" aria-label="กำลังโหลดรายการสัตว์">
        {Array.from({ length: 8 }, (_, i) => (
          <PetCardSkeleton key={i} />
        ))}
      </div>
    )
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  } else if (pets.length === 0) {
    if (filters.page > 1 && total > 0) {
      // ?page= เกินจำนวนหน้าที่มีจริง
      content = (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ไม่มีหน้านี้"
          description={`ตอนนี้มีทั้งหมด ${totalPages} หน้า`}
          action={
            <Button variant="outline" onClick={() => setPage(1)}>
              กลับไปหน้าแรก
            </Button>
          }
        />
      )
    } else if (hasActiveFilters) {
      content = (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ไม่พบสัตว์ตามตัวกรอง"
          description="ลองเปลี่ยนชนิดสัตว์หรือจังหวัดดูนะ"
          action={
            <Button variant="outline" onClick={clearFilters}>
              ล้างตัวกรอง
            </Button>
          }
        />
      )
    } else {
      content = (
        <EmptyState
          title="ยังไม่มีน้องรอบ้านตอนนี้"
          description="ถ้าคุณมีน้องที่กำลังหาบ้านใหม่ ลงประกาศได้เลย"
          action={
            <Button asChild>
              <Link to="/pets/new">
                <PlusIcon aria-hidden />
                ลงประกาศ
              </Link>
            </Button>
          }
        />
      )
    }
  } else {
    content = (
      <div className="space-y-14">
        <div
          className={`${GRID_CLASS} transition-opacity data-[stale=true]:opacity-60`}
          data-stale={query.isPlaceholderData}
          data-featured={filters.page === 1}
        >
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} hideAvailable showSave />
          ))}
        </div>
        <Pagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={query.isPlaceholderData}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">น้อง ๆ ที่กำลังรอบ้าน</h1>
        <p className="text-muted-foreground">
          {query.isSuccess && total > 0 ? `พบ ${total.toLocaleString('th-TH')} ตัวที่เปิดรับคำขอ` : 'เลือกดูตามชนิดสัตว์และจังหวัดที่สะดวก'}
        </p>
      </div>

      <PetFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="pt-8 sm:pt-10">
        {content}
      </div>
    </div>
  )
}
