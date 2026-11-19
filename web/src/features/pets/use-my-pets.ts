import { useQuery } from '@tanstack/react-query'
import { listMyPets } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

// สัตว์ที่ผู้ใช้ลงประกาศ ทุกสถานะ (หน้า /my-pets อยู่ใต้ RequireAuth จึงมี token เสมอ)
export function useMyPets() {
  return useQuery({
    queryKey: queryKeys.pets.mine,
    queryFn: ({ signal }) => listMyPets(signal),
  })
}
