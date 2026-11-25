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

// หน้าแรก: ส่วนต้อนรับ + แถบตัวกรอง (sticky) + รายการสัตว์ที่รอบ้าน + pagination (state อยู่ใน URL)
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
      {/* ส่วนต้อนรับ: เนื้อหาคงที่ ไม่ผูกข้อมูล · พื้นทรายอุ่นยืดเต็มความกว้างจอ (box-shadow + clip-path ไม่ทำให้หน้าล้น)
          -mt ชดเชย padding บนของ <main> ให้แถบชนใต้ header พอดี */}
      <section className="-mt-8 bg-hero py-14 shadow-[0_0_0_100vmax_var(--color-hero)] [clip-path:inset(0_-100vmax)] sm:-mt-10 sm:py-20 lg:py-24">
        {/* ภาษาไทยไม่มีเว้นวรรค เบราว์เซอร์จึงตัดบรรทัดกลางวลีได้ ("กลับ / บ้าน") → แบ่งเป็นสองก้อน inline-block ให้ตัดตรงรอยต่อวลี */}
        <h1 className="text-4xl leading-[1.15] font-bold sm:text-5xl lg:text-6xl">
          <span className="inline-block">พาน้องสักตัว</span>
          <span className="inline-block">กลับบ้านไปด้วยกัน</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
          ดูโปรไฟล์น้องที่เจ้าของกำลังหาบ้านใหม่ให้ ถูกใจตัวไหนก็ยื่นขอรับเลี้ยงได้จากหน้าของน้องเลย
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/pets/new">
            <PlusIcon aria-hidden />
            ลงประกาศหาบ้านให้น้อง
          </Link>
        </Button>
      </section>

      <PetFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <section aria-labelledby="pets-heading" className="pt-10 sm:pt-12">
        <div className="mb-8 space-y-1">
          <h2 id="pets-heading" className="text-2xl font-bold sm:text-3xl">
            น้อง ๆ ที่กำลังรอบ้าน
          </h2>
          <p className="text-muted-foreground">
            {query.isSuccess && total > 0 ? `พบ ${total.toLocaleString('th-TH')} ตัวที่เปิดรับคำขอ` : 'เลือกดูตามชนิดสัตว์และจังหวัดที่สะดวก'}
          </p>
        </div>
        {content}
      </section>
    </div>
  )
}
