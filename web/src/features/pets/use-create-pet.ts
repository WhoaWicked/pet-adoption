import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPet, type CreatePetInput } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

// ลงประกาศ — สำเร็จแล้วให้หน้ารายการ (pets.list) และ "สัตว์ของฉัน" (pets.mine) โหลดใหม่
export function useCreatePet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePetInput) => createPet(input),
    onSuccess: (pet) => {
      // ใส่ข้อมูลลง cache ของหน้ารายละเอียดไว้เลย → พาไปหน้านั้นแล้วแสดงได้ทันทีไม่ต้องโหลดซ้ำ
      queryClient.setQueryData(queryKeys.pets.detail(pet.id), pet)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pets.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pets.mine }),
      ])
    },
  })
}
