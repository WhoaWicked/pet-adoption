import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BellIcon, BellOffIcon, RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/api/errors'
import { formatRelativeTime } from '@/lib/format'
import type { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getNotificationContent } from './notification-content'
import { useMarkRead } from './use-mark-read'
import { useNotifications } from './use-notifications'
import { useUnreadCount } from './use-unread-count'

function badgeText(count: number) {
  return count > 9 ? '9+' : String(count)
}

function NotificationItem({ notification, onSelect }: { notification: Notification; onSelect: (n: Notification) => void }) {
  const unread = notification.read_at === null
  const { text } = getNotificationContent(notification.type)
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className={cn(
          'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
          unread && 'bg-secondary',
        )}
      >
        {/* จุดสีหลัก = ยังไม่อ่าน (ช่องว่างคงไว้ให้ข้อความตรงกันทุกแถว) */}
        <span
          aria-hidden
          className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')}
        />
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm', unread ? 'font-semibold' : 'text-muted-foreground')}>
            {unread && <span className="sr-only">ยังไม่อ่าน: </span>}
            {text}
          </span>
          <span className="block text-xs text-muted-foreground">{formatRelativeTime(notification.created_at)}</span>
        </span>
      </button>
    </li>
  )
}

// กระดิ่งใน header: badge จำนวนที่ยังไม่อ่าน + popover รายการล่าสุด
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const list = useNotifications(open)
  const markRead = useMarkRead()

  const count = unread.data ?? 0

  const onSelect = (notification: Notification) => {
    // ไม่รอผล mark read: badge ลดทันทีจาก cache และถ้าล้มเหลวก็ยังพาไปหน้าที่เกี่ยวข้อง
    if (notification.read_at === null) markRead.mutate(notification.id)
    setOpen(false)
    const { to } = getNotificationContent(notification.type)
    if (to) navigate(to)
  }

  let body
  if (list.isPending) {
    body = (
      <div className="space-y-3 p-3" aria-busy="true" aria-label="กำลังโหลดการแจ้งเตือน">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    )
  } else if (list.isError) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{getErrorMessage(list.error)}</p>
        <Button variant="outline" className="h-9 px-3" onClick={() => list.refetch()} disabled={list.isFetching}>
          <RotateCwIcon className={list.isFetching ? 'animate-spin' : undefined} aria-hidden />
          ลองใหม่
        </Button>
      </div>
    )
  } else if (list.data.data.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-muted-foreground">
        <BellOffIcon className="size-6" aria-hidden />
        <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
      </div>
    )
  } else {
    body = (
      <ul className="max-h-96 space-y-1 overflow-y-auto">
        {list.data.data.map((n) => (
          <NotificationItem key={n.id} notification={n} onSelect={onSelect} />
        ))}
      </ul>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={count > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${count} รายการ` : 'การแจ้งเตือน'}
        >
          <BellIcon className="size-5" />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground"
            >
              {badgeText(count)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-1 p-2">
        <p className="px-3 pt-1 pb-2 text-sm font-semibold">การแจ้งเตือน</p>
        {body}
      </PopoverContent>
    </Popover>
  )
}
