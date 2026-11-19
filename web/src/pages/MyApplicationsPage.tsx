import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FileTextIcon, SearchXIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MyApplicationItem } from '@/features/applications/MyApplicationItem'
import {
  MY_APPLICATIONS_PAGE_SIZE,
  useMyApplications,
  useWithdrawApplication,
} from '@/features/applications/use-my-applications'
import type { MyApplication } from '@/lib/types'
import { usePageParam } from '@/lib/use-page-param'

// หน้า "คำขอของฉัน" — รายการคำขอที่ยื่นไป + ถอนคำขอที่ยังรอพิจารณา
export function MyApplicationsPage() {
  const { page, setPage } = usePageParam()
  const query = useMyApplications(page)
  const withdraw = useWithdrawApplication(page)
  const [target, setTarget] = useState<MyApplication | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const total = query.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / MY_APPLICATIONS_PAGE_SIZE))
  const items = query.data?.data ?? []

  const confirmWithdraw = () => {
    if (!target) return
    // ปิดกล่องเมื่อจบ ไม่ว่าสำเร็จหรือไม่ (error แสดงเป็น toast และรายการโหลดใหม่ให้เห็นสถานะจริง)
    withdraw.mutate(target.id, { onSettled: () => setTarget(null) })
  }

  let content
  if (query.isPending) {
    content = (
      <ul className="space-y-3" aria-busy="true" aria-label="กำลังโหลดคำขอ">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="space-y-2 rounded-2xl bg-secondary p-5">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>
    )
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
  } else if (items.length === 0) {
    content =
      page > 1 && total > 0 ? (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ไม่มีหน้านี้"
          description={`ตอนนี้มีทั้งหมด ${totalPages} หน้า`}
          action={
            <Button variant="outline" onClick={() => setPage(1)}>
              กลับไปหน้าแรก
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<FileTextIcon className="size-7" aria-hidden />}
          title="ยังไม่ได้ยื่นคำขอรับเลี้ยง"
          description="เลือกน้องที่ถูกใจ แล้วยื่นคำขอได้จากหน้ารายละเอียด"
          action={
            <Button asChild>
              <Link to="/">ไปดูน้อง ๆ</Link>
            </Button>
          }
        />
      )
  } else {
    content = (
      <div className="space-y-8">
        <ul className="space-y-3 transition-opacity data-[stale=true]:opacity-60" data-stale={query.isPlaceholderData}>
          {items.map((a) => (
            <MyApplicationItem
              key={a.id}
              application={a}
              onWithdraw={setTarget}
              isWithdrawing={withdraw.isPending && withdraw.variables === a.id}
            />
          ))}
        </ul>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={query.isPlaceholderData} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="คำขอของฉัน"
        description={query.isSuccess && total > 0 ? `ทั้งหมด ${total.toLocaleString('th-TH')} คำขอ` : 'ติดตามสถานะคำขอรับเลี้ยงที่คุณยื่นไว้'}
      />
      {content}
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
        title="ถอนคำขอรับเลี้ยง?"
        description={
          target ? `คำขอรับเลี้ยง ${target.pet_name} จะถูกถอน และเจ้าของจะไม่เห็นคำขอนี้เป็นรายการรอพิจารณาอีก` : ''
        }
        confirmLabel="ถอนคำขอ"
        pendingLabel="กำลังถอน…"
        isPending={withdraw.isPending}
        onConfirm={confirmWithdraw}
        destructive
      />
    </div>
  )
}
