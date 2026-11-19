import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markNotificationRead } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'
import type { Notification, Paged } from '@/lib/types'

// กดอ่านแจ้งเตือน — อัปเดต cache ทันที (badge ลดเลย) แล้วโหลดใหม่ให้ตรงกับ server เมื่อจบ
// ถ้าล้มเหลว (เช่น 404) ไม่ต้องแจ้งผู้ใช้: ผู้ใช้ถูกนำทางไปแล้ว และ invalidate จะคืนตัวเลขจริงให้เอง
export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      // กัน poll ที่กำลังวิ่งอยู่มาเขียนทับค่าที่เพิ่งลด
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })
      queryClient.setQueryData<{ count: number }>(queryKeys.notifications.unreadCount, (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old,
      )
      const readAt = new Date().toISOString()
      queryClient.setQueryData<Paged<Notification>>(queryKeys.notifications.list, (old) =>
        old ? { ...old, data: old.data.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? readAt } : n)) } : old,
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  })
}
