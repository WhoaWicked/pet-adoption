import { ClosingCta } from '@/features/landing/ClosingCta'
import { HowItWorks } from '@/features/landing/HowItWorks'
import { LandingHero } from '@/features/landing/LandingHero'
import { LatestPets, LATEST_PETS_COUNT } from '@/features/landing/LatestPets'
import { usePetsList } from '@/features/pets/use-pets-list'
import type { Pet } from '@/lib/types'

// หน้า landing ("/"): ส่วนต้อนรับ → น้อง ๆ ล่าสุด → ขั้นตอนการรับเลี้ยง → ส่วนปิดท้าย
// ดึงข้อมูลครั้งเดียวด้วย hook เดิมของหน้า /pets (หน้า 1 ไม่มี filter = ตัวล่าสุดที่ยัง available)
// → ไม่ต้องเพิ่ม endpoint และใช้ cache ร่วมกับ /pets หน้า 1 (กดไปดูทั้งหมดแล้วขึ้นทันที)
export function LandingPage() {
  const query = usePetsList({ page: 1 })
  const pets = query.data?.data ?? []
  const latest = pets.slice(0, LATEST_PETS_COUNT)

  return (
    <div>
      <LandingHero pet={pickHeroPet(pets, latest)} isLoading={query.isPending} />
      <LatestPets query={query} pets={latest} />
      <HowItWorks />
      <ClosingCta />
    </div>
  )
}

/** รูปใหญ่ใน hero: ตัวที่มีรูป — เลือกตัวที่ไม่อยู่ในกริด "ล่าสุด" ก่อน จะได้ไม่เห็นตัวเดิมซ้ำสองที่ */
function pickHeroPet(pets: Pet[], latest: Pet[]): Pet | undefined {
  const withImage = pets.filter((p) => p.image_url)
  return withImage.find((p) => !latest.includes(p)) ?? withImage[0] ?? pets[0]
}
