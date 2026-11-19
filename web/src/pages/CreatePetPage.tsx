import { PageHeader } from '@/components/common/PageHeader'
import { CreatePetForm } from '@/features/pets/CreatePetForm'

// หน้า "ลงประกาศ" (ต้อง login — ครอบด้วย RequireAuth ใน router)
export function CreatePetPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="ลงประกาศหาบ้านให้น้อง" description="กรอกข้อมูลให้ครบ เพื่อให้คนที่สนใจตัดสินใจได้ง่ายขึ้น" />
      <div className="rounded-2xl border bg-card p-5 sm:p-8">
        <CreatePetForm />
      </div>
    </div>
  )
}
