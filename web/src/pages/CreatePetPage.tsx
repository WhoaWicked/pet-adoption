import { PageHeader } from '@/components/common/PageHeader'
import { CreatePetForm } from '@/features/pets/CreatePetForm'

// หน้า "ลงประกาศ" (ต้อง login — ครอบด้วย RequireAuth ใน router)
// กว้าง ~640px กลางหน้า · ฟอร์มวางบนพื้นหน้าโดยตรง แบ่งกลุ่มด้วยหัวข้อย่อย + เส้นคั่นบาง (ไม่มีกล่องครอบ)
export function CreatePetPage() {
  return (
    <div className="mx-auto max-w-[40rem]">
      <PageHeader title="ลงประกาศหาบ้านให้น้อง" description="กรอกข้อมูลให้ครบ เพื่อให้คนที่สนใจตัดสินใจได้ง่ายขึ้น" />
      <CreatePetForm />
    </div>
  )
}
