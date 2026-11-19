import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approveApplication, closePet, rejectApplication } from '@/lib/api/endpoints'
import { getErrorMessage } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/query-keys'

/**
 * action ของเจ้าของในหน้าจัดการ: อนุมัติ / ปฏิเสธ / ปิดโพสต์
 * ทุก action อาจเปลี่ยนสถานะสัตว์ → หลังจบ (สำเร็จหรือไม่) โหลดใหม่ทั้งสัตว์ คำขอ และรายการที่แสดงสัตว์ตัวนี้
 * ถ้าได้ 409 (เช่นกดอนุมัติชนกันจากอีกแท็บ) จะเห็นสถานะจริงหลังโหลดใหม่
 */
export function useOwnerActions(petId: string) {
  const queryClient = useQueryClient()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.detail(petId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.byPet(petId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.mine }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.lists }),
    ])

  const onError = (err: unknown) => {
    toast.error(getErrorMessage(err))
  }

  const approve = useMutation({
    mutationFn: (applicationId: string) => approveApplication(applicationId),
    onSuccess: () => toast.success('อนุมัติแล้ว น้องได้บ้านใหม่แล้ว'),
    onError,
    onSettled: refresh,
  })

  const reject = useMutation({
    mutationFn: (applicationId: string) => rejectApplication(applicationId),
    onSuccess: () => toast.success('ปฏิเสธคำขอแล้ว'),
    onError,
    onSettled: refresh,
  })

  const close = useMutation({
    mutationFn: () => closePet(petId),
    onSuccess: () => toast.success('ปิดรับคำขอแล้ว'),
    onError,
    onSettled: refresh,
  })

  // มี action ใดรออยู่ → ปิดทุกปุ่มในหน้า กันอนุมัติ/ปฏิเสธซ้อนกัน
  const isBusy = approve.isPending || reject.isPending || close.isPending

  return { approve, reject, close, isBusy }
}
