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
import { entranceDelay, useEntrance } from '@/lib/use-entrance'

// กริดการ์ด: 375px 1 คอลัมน์ / แท็บเล็ต 2 / จอใหญ่ 3 / จอกว้าง 4 · ระยะห่างเท่ากันทุกจอ · การ์ดสัดส่วนเดียวกันทุกใบ
const GRID_CLASS = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

// ปุ่มในสถานะว่าง: แคปซูลรองตาม DESIGN.md
const PILL_OUTLINE = 'rounded-full border-field-border/50 bg-card px-6'

// หน้า /pets: หัวข้อ + แถบตัวกรอง (sticky) + รายการสัตว์ที่รอบ้าน + pagination (state อยู่ใน URL)
export function PetsListPage() {
  const { filters, setFilter, setPage, clearFilters, hasActiveFilters } = usePetFilters()
  const query = usePetsList(filters)
  // การ์ดเข้าแบบ stagger เฉพาะตอนโหลดครั้งแรกของหน้า — กรอง/เปลี่ยนหน้า/refetch ไม่เล่นซ้ำ
  const entrance = useEntrance(query.isSuccess)

  // เปลี่ยนหน้าแล้วเลื่อนกลับขึ้นบน
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters.page])

  const total = query.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PETS_PAGE_SIZE))
  const pets = query.data?.data ?? []
  const count = total.toLocaleString('th-TH')
  // ไม่มีผลลัพธ์ → ไม่ต้องบอก "พบ 0 ตัว" ซ้ำกับสถานะว่างด้านล่าง
  const resultLine = !query.isSuccess || total === 0
    ? 'เลือกดูตามชนิดสัตว์และจังหวัดที่สะดวก'
    : hasActiveFilters
      ? `พบ ${count} ตัวที่ตรงกับตัวกรอง`
      : `พบ ${count} ตัวที่เปิดรับคำขอ`

  let content
  if (query.isPending) {
    content = (
      <div className={GRID_CLASS} aria-busy="true" aria-label="กำลังโหลดรายการสัตว์">
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
            <Button variant="outline" className={PILL_OUTLINE} onClick={() => setPage(1)}>
              กลับไปหน้าแรก
            </Button>
          }
        />
      )
    } else if (hasActiveFilters) {
      content = (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ยังไม่เจอน้องที่ตรงกับตัวกรองนี้"
          description="ลองเปลี่ยนชนิดสัตว์หรือจังหวัดดูอีกครั้ง"
          action={
            <Button variant="outline" className={PILL_OUTLINE} onClick={clearFilters}>
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
            <Button asChild className="rounded-full px-6">
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
        >
          {pets.map((pet, i) => (
            <div
              key={pet.id}
              className={entrance ? 'h-full animate-enter' : 'h-full'}
              style={entrance ? { animationDelay: `${entranceDelay(i)}ms` } : undefined}
            >
              <PetCard pet={pet} hideAvailable showSave />
            </div>
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
      {/* ส่วนหัวหน้าใช้งาน: หัวข้อขนาดเดียวกับหัวข้อส่วนของ landing + จำนวนผลลัพธ์จริงจาก meta.total */}
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">น้อง ๆ ที่กำลังรอบ้าน</h1>
        <p className="text-muted-foreground">{resultLine}</p>
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
