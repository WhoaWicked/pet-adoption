import { useEffect, useState } from 'react'

const ENTRANCE_WINDOW_MS = 1200 // ยาวกว่า stagger สูงสุด (8 × 50ms) + ความยาวอนิเมชัน (400ms)

/**
 * อนิเมชันเข้าแบบ "ครั้งเดียวตอนเข้าหน้า"
 * - คืน true ตั้งแต่ข้อมูลพร้อมครั้งแรก (ready) จนครบ 1.2 วิ แล้วเป็น false ถาวรตลอดอายุของหน้า
 * - การ์ด/แถวที่ mount ภายหลัง (กรอง, เปลี่ยนหน้า, refetch, invalidate) จึงไม่ได้คลาสอนิเมชัน → ไม่เล่นซ้ำ
 */
export function useEntrance(ready: boolean): boolean {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!ready || done) return
    const timer = setTimeout(() => setDone(true), ENTRANCE_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [ready, done])

  return ready && !done
}

/** stagger 50ms ต่อรายการ สูงสุด 8 รายการแรก รายการที่ 9 ขึ้นไปใช้ดีเลย์เดียวกัน (ขึ้นพร้อมกัน) */
export function entranceDelay(index: number): number {
  return Math.min(index, 8) * 50
}
