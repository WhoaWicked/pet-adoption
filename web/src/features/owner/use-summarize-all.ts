import { useEffect, useRef, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/query-keys'
import type { PetApplication } from '@/lib/types'
import { summaryQueryOptions, useSummarizeMutation } from './use-application-summary'

export interface SummarizeAllProgress {
  current: number
  total: number
}

/**
 * ปุ่ม "สรุปทั้งหมด": สรุปคำขอ pending ทีละใบตามลำดับ (await ใบก่อนจบก่อนเริ่มใบถัดไป ไม่ยิงพร้อมกัน)
 * - ข้ามใบที่มีสรุปแล้ว / กำลังสรุปอยู่จากปุ่มในการ์ด / ไม่ใช่ pending แล้ว (เช็คใหม่ก่อนยิงทุกใบ)
 * - ใบไหนล้มก็ทำใบถัดไปต่อ ยกเว้น 503 (AI ใช้ไม่ได้ทั้งระบบ) ให้หยุดทั้งชุด
 * - ออกจากหน้า → abort: ไม่ยิงใบถัดไปและไม่ setState (ใบที่วิ่งอยู่ปล่อยให้จบ ผลยังเข้า cache)
 */
export function useSummarizeAll(petId: string, pendingIds: string[]) {
  const queryClient = useQueryClient()
  const mutation = useSummarizeMutation()
  const [progress, setProgress] = useState<SummarizeAllProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const runningRef = useRef(false)

  useEffect(() => () => abortRef.current?.abort(), [])

  // จำนวนใบที่ยังไม่มีสรุป — subscribe cache ของแต่ละใบ จึงอัปเดตเองเมื่อการ์ดสรุปเสร็จ
  const remainingCount = useQueries({
    queries: pendingIds.map((id) => summaryQueryOptions(id)),
    combine: (results) => results.filter((r) => !r.data).length,
  })

  // อ่านจากข้อมูลปัจจุบัน ไม่ใช่ snapshot ตอนกด — ระหว่างลูปเจ้าของอาจอนุมัติใบอื่นจนใบที่เหลือถูกปฏิเสธ
  const shouldSummarize = (id: string) => {
    const apps = queryClient.getQueryData<PetApplication[]>(queryKeys.applications.byPet(petId))
    const stillPending = apps?.find((a) => a.id === id)?.status === 'pending'
    const hasSummary = queryClient.getQueryData(queryKeys.applications.summary(id)) !== undefined
    const inFlight =
      queryClient.isMutating({
        mutationKey: queryKeys.applications.summarize,
        predicate: (m) => m.state.variables === id,
      }) > 0
    return stillPending && !hasSummary && !inFlight
  }

  const run = async () => {
    if (runningRef.current) return
    const ids = pendingIds.filter(shouldSummarize)
    if (ids.length === 0) return

    runningRef.current = true
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    try {
      for (const [index, id] of ids.entries()) {
        if (signal.aborted) return
        if (!shouldSummarize(id)) continue
        setProgress({ current: index + 1, total: ids.length })
        try {
          await mutation.mutateAsync(id)
        } catch (err) {
          // error ของแต่ละใบแสดงในการ์ดเองจาก mutation state ที่นี่แค่ตัดสินว่าจะไปต่อไหม
          if (signal.aborted) return
          if (err instanceof ApiError && err.statusCode === 503) {
            toast.error('บริการ AI ใช้ไม่ได้ชั่วคราว หยุดสรุปใบที่เหลือ')
            break
          }
        }
      }
    } finally {
      runningRef.current = false
      if (!signal.aborted) setProgress(null)
    }
  }

  return { run, isRunning: progress !== null, progress, remainingCount }
}
