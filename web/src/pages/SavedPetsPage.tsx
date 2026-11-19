import { Link } from 'react-router'
import { HeartIcon, HeartOffIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import { useSavedPets, useUnsavePet } from '@/features/pets/use-saved-pets'

// หน้า "ที่บันทึกไว้" — แสดงทุกสถานะ (ป้ายบนการ์ดบอก "ปิดรับแล้ว"/"มีบ้านแล้ว") และเลิกบันทึกได้
export function SavedPetsPage() {
  const query = useSavedPets()
  const unsave = useUnsavePet()
  const pets = query.data ?? []

  let content
  if (query.isPending) {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="กำลังโหลดรายการที่บันทึกไว้">
        {Array.from({ length: 3 }, (_, i) => (
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
          <Button asChild className="h-10 px-4">
            <Link to="/">ไปดูน้อง ๆ</Link>
          </Button>
        }
      />
    )
  } else {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => {
          const isRemoving = unsave.isPending && unsave.variables === pet.id
          return (
            <div key={pet.id} className="flex flex-col gap-2">
              <PetCard pet={pet} />
              {/* ปุ่มอยู่นอกลิงก์ของการ์ด — กดแล้วไม่พาไปหน้ารายละเอียด */}
              <Button
                variant="ghost"
                className="h-9 self-end px-3 text-muted-foreground"
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
      <PageHeader
        title="ที่บันทึกไว้"
        description={query.isSuccess && pets.length > 0 ? `${pets.length} ตัวที่คุณสนใจ` : 'น้อง ๆ ที่คุณเก็บไว้ดูทีหลัง'}
      />
      {content}
    </div>
  )
}
