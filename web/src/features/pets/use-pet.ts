import { useQuery } from '@tanstack/react-query'
import { getPet } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'

// รายละเอียดสัตว์ 1 ตัว (404 / id ผิดรูปแบบไม่ retry ตามกติกาใน query-client)
export function usePet(id: string) {
  return useQuery({
    queryKey: queryKeys.pets.detail(id),
    queryFn: ({ signal }) => getPet(id, signal),
  })
}
