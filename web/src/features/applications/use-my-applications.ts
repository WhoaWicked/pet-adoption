import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listMyApplications, withdrawApplication } from '@/lib/api/endpoints'
import { getErrorMessage } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/query-keys'
import type { MyApplication, Paged } from '@/lib/types'

export const MY_APPLICATIONS_PAGE_SIZE = 10

// รายการคำขอของฉัน ตามหน้า (page → limit/offset)
export function useMyApplications(page: number) {
  return useQuery({
    queryKey: queryKeys.applications.mine(page),
    queryFn: ({ signal }) =>
      listMyApplications(
        { limit: MY_APPLICATIONS_PAGE_SIZE, offset: (page - 1) * MY_APPLICATIONS_PAGE_SIZE },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
}

// ถอนคำขอ — สำเร็จแล้วแก้สถานะในหน้าปัจจุบันทันที แล้วโหลดใหม่ให้ตรงกับ server
export function useWithdrawApplication(page: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => withdrawApplication(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<Paged<MyApplication>>(queryKeys.applications.mine(page), (old) =>
        old
          ? { ...old, data: old.data.map((a) => (a.id === updated.id ? { ...a, status: updated.status } : a)) }
          : old,
      )
      toast.success('ถอนคำขอแล้ว')
    },
    onError: (err) => {
      // เช่น 409 คำขอถูกตัดสินไปแล้วระหว่างที่เปิดหน้าค้าง — แสดงเหตุผล แล้วโหลดสถานะจริง
      toast.error(getErrorMessage(err))
    },
    // pets.mine มี pending_count ที่นับจากคำขอ — ให้ถือว่าเก่าเมื่อคำขอเปลี่ยน
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.applications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pets.mine }),
      ]),
  })
}
