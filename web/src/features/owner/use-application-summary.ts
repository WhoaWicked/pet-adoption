import { queryOptions, skipToken, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MutationState } from '@tanstack/react-query'
import { summarizeApplication } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/query/query-keys'
import type { ApplicationSummaryResult } from '@/lib/types'

/**
 * ผลสรุปของคำขอ 1 ใบใน cache — ไม่มี queryFn (skipToken) จึงไม่ยิง request เอง
 * ข้อมูลเข้ามาทาง setQueryData หลังสรุปสำเร็จเท่านั้น
 */
export function summaryQueryOptions(applicationId: string) {
  return queryOptions<ApplicationSummaryResult>({
    queryKey: queryKeys.applications.summary(applicationId),
    queryFn: skipToken,
  })
}

/**
 * mutation สรุปคำขอ — ทุกที่ (การ์ดและ "สรุปทั้งหมด") ใช้ mutationKey เดียวกัน การ์ดจึงเห็นสถานะเดียวกัน
 * onSuccess อยู่ที่ระดับ hook (ไม่ใช่ที่ mutate()) เพราะ TanStack ยังเรียกแม้ component unmount แล้ว
 * → ผลที่ BE สรุปเสร็จ (เสียโควตา AI ไปแล้ว) ไม่หาย
 * ไม่ invalidate อะไร เพราะการสรุปไม่เปลี่ยนสถานะคำขอหรือสัตว์
 */
export function useSummarizeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: queryKeys.applications.summarize,
    mutationFn: (applicationId: string) => summarizeApplication(applicationId),
    onSuccess: (data, applicationId) => {
      queryClient.setQueryData(queryKeys.applications.summary(applicationId), data)
    },
  })
}

type SummarizeState = MutationState<ApplicationSummaryResult, Error, string>

/** สถานะสรุปของคำขอ 1 ใบ: ผลจาก cache + สถานะโหลด/error ของ mutation ล่าสุดของใบนี้ (ใครเป็นคนเริ่มก็ได้) */
export function useApplicationSummary(applicationId: string) {
  const { data } = useQuery(summaryQueryOptions(applicationId))
  const mutation = useSummarizeMutation()

  const states = useMutationState<SummarizeState>({
    filters: {
      mutationKey: queryKeys.applications.summarize,
      predicate: (m) => m.state.variables === applicationId,
    },
    select: (m) => m.state as SummarizeState,
  })
  const latest = states.at(-1)

  return {
    summary: data?.summary,
    isLoading: latest?.status === 'pending',
    error: latest?.status === 'error' ? latest.error : null,
    summarize: () => mutation.mutate(applicationId),
  }
}
