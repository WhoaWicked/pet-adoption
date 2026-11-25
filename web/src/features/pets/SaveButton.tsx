import { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { loginPath } from '@/features/auth/redirect'
import { cn } from '@/lib/utils'
import { useIsPetSaved, useToggleSave } from './use-saved-pets'

// ปุ่มบันทึก/เลิกบันทึก — ยังไม่ login กดแล้วพาไป login แล้วกลับมาหน้านี้
// variant="icon": วงกลมขาวมีแต่หัวใจ (วางบนรูปในการ์ด) — ข้อความเดิมย้ายไปเป็น aria-label
export function SaveButton({
  petId,
  className,
  variant = 'button',
}: {
  petId: string
  className?: string
  variant?: 'button' | 'icon'
}) {
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isSaved, isLoading } = useIsPetSaved(petId)
  const toggle = useToggleSave(petId)

  const onClick = () => {
    if (status !== 'authenticated') {
      navigate(loginPath(location.pathname + location.search))
      return
    }
    toggle.mutate(!isSaved)
  }

  // toggle จริง (login อยู่) → หัวใจ pop 1 → 1.25 → 1 ใน 250ms ด้วย Web Animations API
  // เรียกก่อน onClick เดิม ไม่แตะ logic
  const iconRef = useRef<SVGSVGElement>(null)
  const handleClick = () => {
    if (status === 'authenticated') {
      iconRef.current?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        { duration: 250, easing: 'ease-out' },
      )
    }
    onClick()
  }

  const busy = status === 'checking' || isLoading || toggle.isPending
  const label = toggle.isPending ? 'กำลังบันทึก…' : isSaved ? 'บันทึกไว้แล้ว' : 'บันทึกน้อง'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={status === 'authenticated' ? isSaved : undefined}
        aria-label={label}
        title={label}
        className={cn(
          'flex size-10 items-center justify-center rounded-full bg-card text-foreground transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70 motion-reduce:hover:scale-100',
          className,
        )}
      >
        <HeartIcon ref={iconRef} className={cn('size-5', isSaved && 'fill-primary text-primary')} aria-hidden />
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={status === 'authenticated' ? isSaved : undefined}
    >
      <HeartIcon ref={iconRef} className={cn(isSaved && 'fill-primary text-primary')} aria-hidden />
      {label}
    </Button>
  )
}
