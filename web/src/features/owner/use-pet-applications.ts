import { useQuery } from '@tanstack/react-query'
import { listPetApplications } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

// คำขอของสัตว์ตัวหนึ่ง (เจ้าของดู) — enabled=false จนกว่าจะรู้ว่าผู้ใช้เป็นเจ้าของ กันยิง request ที่ได้ 403 แน่ ๆ
export function usePetApplications(petId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.applications.byPet(petId),
    queryFn: ({ signal }) => listPetApplications(petId, signal),
    enabled,
  })
}
