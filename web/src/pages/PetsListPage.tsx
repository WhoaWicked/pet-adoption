import { useEffect } from 'react'
import { Link } from 'react-router'
import { PlusIcon, SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import { PetFilters } from '@/features/pets/PetFilters'
import { PETS_PAGE_SIZE, usePetFilters } from '@/features/pets/use-pet-filters'
import { usePetsList } from '@/features/pets/use-pets-list'

// หน้าแรก: รายการสัตว์ที่รอบ้าน + filter + pagination (state อยู่ใน URL)
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="กำลังโหลดรายการสัตว์">
        {Array.from({ length: 6 }, (_, i) => (
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
      <div className="space-y-8">
        <div
          className="grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 data-[stale=true]:opacity-60"
          data-stale={query.isPlaceholderData}
        >
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
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
      <PageHeader
        title="น้อง ๆ ที่กำลังรอบ้าน"
        description={
          query.isSuccess && total > 0 ? `พบ ${total.toLocaleString('th-TH')} ตัวที่เปิดรับคำขอ` : 'เลือกดูตามชนิดสัตว์และจังหวัดที่สะดวก'
        }
      />
      <div className="space-y-6">
        <PetFilters
          filters={filters}
          onChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        {content}
      </div>
    </div>
  )
}
