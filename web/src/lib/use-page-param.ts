import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// หน้าปัจจุบันเก็บใน URL (?page=) — ค่าที่ไม่ใช่จำนวนเต็ม ≥ 1 ถือเป็นหน้า 1
export function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))

  const setPage = useCallback(
    (next: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        if (next <= 1) params.delete('page')
        else params.set('page', String(next))
        return params
      })
    },
    [setSearchParams],
  )

  return { page, setPage }
}
