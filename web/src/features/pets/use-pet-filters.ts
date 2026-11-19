import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { isSpecies } from '@/lib/constants/labels'
import { isProvince } from '@/lib/constants/provinces'
import type { Species } from '@/lib/types'

// filter + หน้าปัจจุบันของหน้ารายการสัตว์ เก็บใน URL (?species=&province=&page=) เพื่อ refresh/แชร์ลิงก์ได้

export const PETS_PAGE_SIZE = 12

export interface PetFilters {
  species?: Species
  province?: string
  page: number
}

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export function usePetFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ค่าที่ไม่รู้จัก (เช่น ?species=bird หรือจังหวัดสะกดผิด) ถูกเมิน — ไม่ส่งต่อไป API
  const speciesParam = searchParams.get('species')
  const provinceParam = searchParams.get('province')
  const pageParam = searchParams.get('page')
  const filters = useMemo<PetFilters>(
    () => ({
      species: isSpecies(speciesParam) ? speciesParam : undefined,
      province: isProvince(provinceParam) ? provinceParam : undefined,
      page: parsePage(pageParam),
    }),
    [speciesParam, provinceParam, pageParam],
  )

  /** เปลี่ยน filter (undefined = ทั้งหมด → ลบ param ทิ้ง) และกลับไปหน้าแรก */
  const setFilter = useCallback(
    (key: 'species' | 'province', value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (page <= 1) next.delete('page')
        else next.set('page', String(page))
        return next
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => setSearchParams({}), [setSearchParams])

  const hasActiveFilters = Boolean(filters.species || filters.province)

  return { filters, setFilter, setPage, clearFilters, hasActiveFilters }
}
