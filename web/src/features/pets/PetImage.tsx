import { useState } from 'react'
import { CatIcon, DogIcon, PawPrintIcon } from 'lucide-react'
import type { Species } from '@/lib/types'
import { cn } from '@/lib/utils'

const PLACEHOLDER_ICONS = { dog: DogIcon, cat: CatIcon, other: PawPrintIcon } as const

// รูปสัตว์ — ไม่มี image_url หรือโหลดรูปไม่ขึ้น → แสดง placeholder ตามชนิดสัตว์
export function PetImage({
  src,
  alt,
  species,
  className,
}: {
  src: string | null
  alt: string
  species: Species
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src

  if (showImage) {
    return (
      <img
        src={src!}
        alt={alt}
        loading="lazy"
        onError={() => setFailedSrc(src)}
        className={cn('size-full object-cover', className)}
      />
    )
  }

  const Icon = PLACEHOLDER_ICONS[species]
  return (
    <div
      role="img"
      aria-label={`${alt} (ยังไม่มีรูป)`}
      // placeholder นุ่ม ๆ: พื้น muted ไอคอนเส้นบางสีจาง ไม่แย่งความสนใจจากการ์ดที่มีรูปจริง
      className={cn('flex size-full items-center justify-center bg-muted text-muted-foreground/35', className)}
    >
      <Icon className="size-10" strokeWidth={1.25} aria-hidden />
    </div>
  )
}
