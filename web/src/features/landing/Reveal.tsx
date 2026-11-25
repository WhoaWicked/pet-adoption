import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ค่อย ๆ โผล่ (fade + เลื่อนขึ้น 16px) ครั้งเดียวเมื่อเลื่อนมาถึง
// - อนิเมชันอยู่หลัง motion-safe: ผู้ใช้ที่ตั้ง reduced-motion เห็นเนื้อหาทันที
// - เบราว์เซอร์ไม่มี IntersectionObserver → แสดงทันที (ค่าเริ่มต้นของ state)
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      // เริ่มเมื่อส่วนนั้นเข้ามาในจอแล้วราว 10% จากขอบล่าง
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      data-shown={shown}
      className={cn(
        'motion-safe:transition motion-safe:duration-700 motion-safe:ease-out',
        'motion-safe:data-[shown=false]:translate-y-4 motion-safe:data-[shown=false]:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
