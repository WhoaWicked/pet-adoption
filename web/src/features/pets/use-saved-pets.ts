import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/auth-context'
import { listSavedPets, savePet, unsavePet } from '@/lib/api/endpoints'
import { getErrorMessage } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query/query-keys'

// สัตว์ที่บันทึกไว้ — API ไม่มี field "is_saved" ในรายละเอียดสัตว์ จึงดูจากรายการ GET /pets/saved

/** query รายการที่บันทึกไว้ (ทำงานเฉพาะตอน login แล้ว) — หน้า /saved รอบถัดไปใช้ตัวเดียวกัน */
export function useSavedPets() {
  const { status } = useAuth()
  return useQuery({
    queryKey: queryKeys.pets.saved,
    queryFn: ({ signal }) => listSavedPets(signal),
    enabled: status === 'authenticated',
  })
}

/** สัตว์ตัวนี้ถูกบันทึกไว้หรือยัง */
export function useIsPetSaved(petId: string) {
  const saved = useSavedPets()
  const ids = useMemo(() => new Set(saved.data?.map((p) => p.id)), [saved.data])
  return { isSaved: ids.has(petId), isLoading: saved.isPending && saved.fetchStatus !== 'idle' }
}

/** บันทึก / เลิกบันทึก แล้วโหลดรายการที่บันทึกใหม่ */
export function useToggleSave(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (save: boolean) => (save ? savePet(petId) : unsavePet(petId)),
    onSuccess: (_data, save) => {
      toast.success(save ? 'บันทึกน้องไว้แล้ว' : 'เลิกบันทึกแล้ว')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
    // รอให้รายการโหลดเสร็จก่อนจบ mutation → ไอคอนไม่กระพริบกลับไปสถานะเดิม
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.pets.saved }),
  })
}
