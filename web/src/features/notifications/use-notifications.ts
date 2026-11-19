import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import { listNotifications } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

export const NOTIFICATIONS_LIMIT = 10

// รายการแจ้งเตือนล่าสุด — โหลดเฉพาะตอนเปิด popover และโหลดใหม่ทุกครั้งที่เปิด (staleTime 0)
export function useNotifications(open: boolean) {
  const { status } = useAuth()
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ signal }) => listNotifications({ limit: NOTIFICATIONS_LIMIT, offset: 0 }, signal),
    enabled: status === 'authenticated' && open,
    staleTime: 0,
  })
}
