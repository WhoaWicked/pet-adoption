import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { PetCard, PetCardSkeleton } from '@/features/pets/PetCard'
import { useMyPets } from '@/features/pets/use-my-pets'

function NewPostButton() {
  return (
    <Button asChild className="h-10 px-4">
      <Link to="/pets/new">
        <PlusIcon aria-hidden />
        ลงประกาศ
      </Link>
    </Button>
  )
}

// หน้า "สัตว์ของฉัน" — ทุกสถานะ กดการ์ดแล้วไปหน้าจัดการ (ไม่ใช่หน้ารายละเอียดสาธารณะ)
export function MyPetsPage() {
  const query = useMyPets()
  const pets = query.data ?? []

  let content
  if (query.isPending) {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="กำลังโหลดสัตว์ของฉัน">
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
        title="ยังไม่ได้ลงประกาศ"
        description="ถ้ามีน้องที่กำลังหาบ้านใหม่ ลงประกาศได้เลย แล้วดูคำขอที่เข้ามาได้ที่หน้านี้"
        action={<NewPostButton />}
      />
    )
  } else {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} to={`/my-pets/${pet.id}`} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="สัตว์ของฉัน"
        description="ประกาศที่คุณลง กดเพื่อดูคำขอ อนุมัติ หรือปิดโพสต์"
        action={pets.length > 0 ? <NewPostButton /> : undefined}
      />
      {content}
    </div>
  )
}
