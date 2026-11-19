import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import { getUnreadCount } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

const POLL_INTERVAL_MS = 30_000

// จำนวนแจ้งเตือนที่ยังไม่อ่าน — poll ทุก ~30 วินาที (ไม่ทำ real-time)
// enabled เฉพาะตอน login: logout แล้ว query ปิด → หยุด poll ทันที
// 401 ระหว่าง poll ไหลเข้า unauthorized handler เดิมใน AuthProvider (มี ref กันเด้งซ้ำอยู่แล้ว)
export function useUnreadCount() {
  const { status } = useAuth()
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: status === 'authenticated',
    refetchInterval: POLL_INTERVAL_MS,
    // ค่าเริ่มต้นของ TanStack: ไม่ poll ตอนแท็บไม่ได้เปิดอยู่ ประหยัด request
    refetchIntervalInBackground: false,
    select: (data) => data.count,
  })
}
