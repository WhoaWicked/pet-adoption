import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listPets, type PetListFilter } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'
import { PETS_PAGE_SIZE, type PetFilters } from './use-pet-filters'

// ดึงรายการสัตว์ (เฉพาะ available) ตาม filter/หน้า — แปลง page → limit/offset ตรงนี้
export function usePetsList(filters: PetFilters) {
  const request: PetListFilter = {
    species: filters.species,
    province: filters.province,
    limit: PETS_PAGE_SIZE,
    offset: (filters.page - 1) * PETS_PAGE_SIZE,
  }

  return useQuery({
    queryKey: queryKeys.pets.list(request),
    queryFn: ({ signal }) => listPets(request, signal),
    // เปลี่ยนหน้า/filter แล้วยังเห็นรายการเดิมระหว่างโหลด (ไม่กระพริบเป็น skeleton)
    placeholderData: keepPreviousData,
  })
}
