import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ก่อนหน้า / หน้า x จาก y / ถัดไป — ซ่อนเมื่อมีหน้าเดียว
export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="เปลี่ยนหน้า">
      <Button
        variant="outline"
        className="px-3"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        <ChevronLeftIcon aria-hidden />
        ก่อนหน้า
      </Button>
      <span className="min-w-24 text-center text-sm text-muted-foreground" aria-live="polite">
        หน้า {page} จาก {totalPages}
      </span>
      <Button
        variant="outline"
        className="px-3"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        ถัดไป
        <ChevronRightIcon aria-hidden />
      </Button>
    </nav>
  )
}
