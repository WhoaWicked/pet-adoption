import { ClosingCta } from '@/features/landing/ClosingCta'
import { Faq } from '@/features/landing/Faq'
import { HowItWorks } from '@/features/landing/HowItWorks'
import { LandingHero } from '@/features/landing/LandingHero'
import { LatestPets, LATEST_PETS_COUNT } from '@/features/landing/LatestPets'
import { PhotoShowcase } from '@/features/landing/PhotoShowcase'
import { usePetsList } from '@/features/pets/use-pets-list'
import type { Pet } from '@/lib/types'

// หน้า landing ("/"): ต้อนรับ → กรอบรูป → ขั้นตอน → น้องล่าสุด → FAQ → ปิดท้าย (footer อยู่ใน AppLayout)
// จังหวะ: สลับส่วนประโยคกลางหน้าโล่ง ๆ กับส่วนการ์ดที่แน่นขึ้น
// ดึงข้อมูลครั้งเดียวด้วย hook เดิมของหน้า /pets (หน้า 1 ไม่มี filter = ตัวล่าสุดที่ยัง available)
// → ไม่ต้องเพิ่ม endpoint และใช้ cache ร่วมกับ /pets หน้า 1
export function LandingPage() {
  const query = usePetsList({ page: 1 })
  const pets = query.data?.data ?? []
  const latest = pets.slice(0, LATEST_PETS_COUNT)

  return (
    <div>
      <LandingHero />
      <PhotoShowcase pets={pickShowcasePets(pets, latest)} isLoading={query.isPending} />
      <HowItWorks />
      <LatestPets query={query} pets={latest} />
      <Faq />
      <ClosingCta />
    </div>
  )
}

/** รูปในคอลัมน์เลื่อน: ทุกตัวที่มีรูป — ตัวที่ไม่อยู่ในกริด "ล่าสุด" ขึ้นก่อน (PhotoShowcase ทำซ้ำเองถ้าไม่พอ) */
function pickShowcasePets(pets: Pet[], latest: Pet[]): Pet[] {
  const withImage = pets.filter((p) => p.image_url)
  const notInLatest = withImage.filter((p) => !latest.includes(p))
  const inLatest = withImage.filter((p) => latest.includes(p))
  return [...notInLatest, ...inLatest]
}
