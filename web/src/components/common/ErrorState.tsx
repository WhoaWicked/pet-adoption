import { CloudOffIcon, RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api/errors'

// สถานะโหลดไม่สำเร็จ: แสดงข้อความภาษาไทยจาก error + ปุ่มลองใหม่
export function ErrorState({
  error,
  title = 'โหลดข้อมูลไม่สำเร็จ',
  onRetry,
  isRetrying = false,
}: {
  error: unknown
  title?: string
  onRetry?: () => void
  isRetrying?: boolean
}) {
  return (
    // ไม่มีกล่อง: กึ่งกลางบนพื้นหน้า · วงไอคอนแดงอ่อน
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="mb-1 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CloudOffIcon className="size-7" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry} disabled={isRetrying}>
          <RotateCwIcon className={isRetrying ? 'animate-spin' : undefined} aria-hidden />
          {isRetrying ? 'กำลังลองใหม่…' : 'ลองใหม่'}
        </Button>
      )}
    </div>
  )
}
