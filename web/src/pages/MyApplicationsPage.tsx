import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FileTextIcon, SearchXIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
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

const PILL_OUTLINE = 'rounded-full border-field-border/50 bg-card px-6'

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
      // skeleton ทรงแถว: คอลัมน์เดียวกับ MyApplicationItem (ชื่อ+คำตอบ | วันที่ | ป้าย | ปุ่ม)
      <ul className="divide-y border-y" aria-busy="true" aria-label="กำลังโหลดคำขอ">
        {Array.from({ length: 4 }, (_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 py-5 md:grid md:grid-cols-[minmax(0,1fr)_10rem_8rem_7.5rem] md:items-center md:gap-6"
          >
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </div>
            <Skeleton className="h-4 w-28 bg-muted" />
            <Skeleton className="h-6 w-20 rounded-full bg-muted" />
            <span />
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
            <Button variant="outline" className={PILL_OUTLINE} onClick={() => setPage(1)}>
              กลับไปหน้าแรก
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<FileTextIcon className="size-7" aria-hidden />}
          title="ยังไม่ได้ยื่นคำขอรับเลี้ยง"
          description="เลือกน้องที่ถูกใจ แล้วส่งคำขอได้จากหน้าของน้อง"
          action={
            <Button asChild className="rounded-full px-6">
              <Link to="/pets">ไปดูน้อง ๆ</Link>
            </Button>
          }
        />
      )
  } else {
    content = (
      <div className="space-y-8">
        {/* รายการแถวคั่นด้วยเส้นบาง ไม่มีกล่อง/การ์ด */}
        <ul className="divide-y border-y transition-opacity data-[stale=true]:opacity-60" data-stale={query.isPlaceholderData}>
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
      {/* ส่วนหัวแบบเดียวกับ /pets: หัวข้อ + จำนวนจริง */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">คำขอของฉัน</h1>
        <p className="text-muted-foreground">
          {query.isSuccess && total > 0 ? `ทั้งหมด ${total.toLocaleString('th-TH')} คำขอ` : 'ติดตามสถานะคำขอรับเลี้ยงที่คุณส่งไว้'}
        </p>
      </div>
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
