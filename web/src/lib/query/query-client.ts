import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

// status ที่ retry ไปก็ได้ผลเหมือนเดิม — ไม่ retry
// (400 เพิ่มจากที่ spec กำหนด เพราะ validation error ไม่มีทางผ่านเมื่อส่งซ้ำ)
const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 409])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && NO_RETRY_STATUSES.has(error.statusCode)) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      // action ของผู้ใช้ไม่ retry อัตโนมัติ (กันยื่น/อนุมัติซ้ำ)
      retry: false,
    },
  },
})
