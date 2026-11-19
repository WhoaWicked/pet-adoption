import { useLocation, useNavigate } from 'react-router'
import { HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { loginPath } from '@/features/auth/redirect'
import { cn } from '@/lib/utils'
import { useIsPetSaved, useToggleSave } from './use-saved-pets'

// ปุ่มบันทึก/เลิกบันทึก — ยังไม่ login กดแล้วพาไป login แล้วกลับมาหน้านี้
export function SaveButton({ petId, className }: { petId: string; className?: string }) {
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

  const busy = status === 'checking' || isLoading || toggle.isPending

  return (
    <Button
      variant="outline"
      className={cn('h-10 px-4', className)}
      onClick={onClick}
      disabled={busy}
      aria-pressed={status === 'authenticated' ? isSaved : undefined}
    >
      <HeartIcon className={cn(isSaved && 'fill-primary text-primary')} aria-hidden />
      {toggle.isPending ? 'กำลังบันทึก…' : isSaved ? 'บันทึกไว้แล้ว' : 'บันทึกน้อง'}
    </Button>
  )
}
