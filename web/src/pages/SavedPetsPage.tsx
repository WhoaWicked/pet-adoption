import { Link } from 'react-router'
import { HeartIcon, HeartOffIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import { useSavedPets, useUnsavePet } from '@/features/pets/use-saved-pets'

// กริดเดียวกับ /pets: 1 / 2 / 3 / 4 คอลัมน์ ระยะห่างเท่ากัน
const GRID_CLASS = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

// หน้า "ที่บันทึกไว้" — แสดงทุกสถานะ (ป้ายบนการ์ดเฉพาะ "ปิดรับแล้ว"/"มีบ้านแล้ว" ที่ต่างจากปกติ) และเลิกบันทึกได้
export function SavedPetsPage() {
  const query = useSavedPets()
  const unsave = useUnsavePet()
  const pets = query.data ?? []

  let content
  if (query.isPending) {
    content = (
      <div className={GRID_CLASS} aria-busy="true" aria-label="กำลังโหลดรายการที่บันทึกไว้">
        {Array.from({ length: 4 }, (_, i) => (
          <PetCardSkeleton key={i} />
        ))}
      </div>
    )
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  } else if (pets.length === 0) {
    content = (
      <EmptyState
        icon={<HeartIcon className="size-7" aria-hidden />}
        title="ยังไม่ได้บันทึกน้องตัวไหน"
        description="กดปุ่ม “บันทึกน้อง” ในหน้ารายละเอียด เพื่อเก็บไว้ดูทีหลัง"
        action={
          <Button asChild className="rounded-full px-6">
            <Link to="/pets">ไปดูน้อง ๆ</Link>
          </Button>
        }
      />
    )
  } else {
    content = (
      <div className={GRID_CLASS}>
        {pets.map((pet) => {
          const isRemoving = unsave.isPending && unsave.variables === pet.id
          return (
            <div key={pet.id} className="flex flex-col gap-2">
              <PetCard pet={pet} hideAvailable />
              {/* ปุ่มอยู่นอกลิงก์ของการ์ด — กดแล้วไม่พาไปหน้ารายละเอียด */}
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 self-start rounded-full px-3 text-muted-foreground"
                onClick={() => unsave.mutate(pet.id)}
                disabled={isRemoving}
              >
                <HeartOffIcon aria-hidden />
                {isRemoving ? 'กำลังเลิกบันทึก…' : 'เลิกบันทึก'}
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* ส่วนหัวแบบเดียวกับ /pets: หัวข้อ + จำนวนจริง */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">ที่บันทึกไว้</h1>
        <p className="text-muted-foreground">
          {query.isSuccess && pets.length > 0 ? `บันทึกไว้ ${pets.length.toLocaleString('th-TH')} ตัว` : 'น้อง ๆ ที่คุณเก็บไว้ดูทีหลัง'}
        </p>
      </div>
      {content}
    </div>
  )
}
