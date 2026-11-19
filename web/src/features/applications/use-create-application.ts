import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'
import { createApplication, type CreateApplicationInput } from '@/lib/api/endpoints'
import { getErrorMessage } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/query-keys'

export function isConflict(err: unknown): boolean {
  return err instanceof ApiError && err.statusCode === 409
}

// ยื่นคำขอรับเลี้ยง
export function useCreateApplication(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: CreateApplicationInput['answers']) => createApplication({ petId, answers }),
    onSuccess: () => {
      // รายการ "คำขอของฉัน" ต้องเห็นคำขอใหม่
      return queryClient.invalidateQueries({ queryKey: queryKeys.applications.all })
    },
    onError: (err) => {
      // 409 อาจเป็นเพราะสัตว์ถูกรับเลี้ยง/ปิดโพสต์ไประหว่างกรอก → โหลดสถานะสัตว์ใหม่
      // แสดงเป็น toast เพราะถ้าสถานะเปลี่ยน ฟอร์มจะถูกแทนด้วยข้อความ "ปิดรับแล้ว" และ Alert ในฟอร์มจะหายไปด้วย
      if (isConflict(err)) {
        toast.error(getErrorMessage(err))
        return queryClient.invalidateQueries({ queryKey: queryKeys.pets.detail(petId) })
      }
    },
  })
}
