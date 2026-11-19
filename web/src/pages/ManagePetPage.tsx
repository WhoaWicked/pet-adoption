import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeftIcon, InboxIcon, SearchXIcon, ShieldAlertIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { ManagePetHeader } from '@/features/owner/ManagePetHeader'
import { PetApplicationCard } from '@/features/owner/PetApplicationCard'
import { useOwnerActions } from '@/features/owner/use-owner-actions'
import { usePetApplications } from '@/features/owner/use-pet-applications'
import { usePet } from '@/features/pets/use-pet'
import { ApiError } from '@/lib/api/client'
import { isNotFoundError } from '@/lib/api/errors'
import type { PetApplication } from '@/lib/types'

type PendingAction =
  | { kind: 'approve'; application: PetApplication }
  | { kind: 'reject'; application: PetApplication }
  | { kind: 'close' }

function BackToMyPets() {
  return (
    <Button asChild variant="ghost" className="-ml-2 mb-4 h-9 px-2 text-muted-foreground">
      <Link to="/my-pets">
        <ArrowLeftIcon aria-hidden />
        สัตว์ของฉัน
      </Link>
    </Button>
  )
}

function NotOwnerState() {
  return (
    <EmptyState
      icon={<ShieldAlertIcon className="size-7" aria-hidden />}
      title="คุณไม่ใช่เจ้าของโพสต์นี้"
      description="หน้าจัดการเปิดได้เฉพาะคนที่ลงประกาศน้องตัวนี้"
      action={
        <Button asChild variant="outline" className="h-10 px-4">
          <Link to="/my-pets">ไปที่สัตว์ของฉัน</Link>
        </Button>
      }
    />
  )
}

// pending ขึ้นก่อน (ต้องตัดสิน) ที่เหลือคงลำดับเดิมจาก API (ใหม่สุดก่อน)
function sortPendingFirst(list: PetApplication[]) {
  return [...list].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
}

// หน้าจัดการสัตว์ 1 ตัวของเจ้าของ: ดูคำขอ, อนุมัติ/ปฏิเสธ, ปิดโพสต์
export function ManagePetPage() {
  const { petId = '' } = useParams()
  const { userId } = useAuth()
  const petQuery = usePet(petId)
  const pet = petQuery.data

  // รู้ว่าไม่ใช่เจ้าของจากข้อมูลสัตว์ได้เลย ไม่ต้องรอ 403 · ถ้าไม่รู้ userId (เช่น /auth/me ล้ม) ให้ API ตัดสิน
  const knownNotOwner = Boolean(pet && userId && pet.owner_id !== userId)
  const appsQuery = usePetApplications(petId, Boolean(pet) && !knownNotOwner)
  const actions = useOwnerActions(petId)
  const [dialog, setDialog] = useState<PendingAction | null>(null)

  const applications = useMemo(() => sortPendingFirst(appsQuery.data ?? []), [appsQuery.data])
  const pendingCount = applications.filter((a) => a.status === 'pending').length

  if (petQuery.isPending) {
    return (
      <div>
        <BackToMyPets />
        <div className="space-y-4" aria-busy="true" aria-label="กำลังโหลด">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (petQuery.isError) {
    if (isNotFoundError(petQuery.error)) {
      return (
        <EmptyState
          icon={<SearchXIcon className="size-7" aria-hidden />}
          title="ไม่พบข้อมูลสัตว์ตัวนี้"
          description="ลิงก์อาจไม่ถูกต้อง หรือประกาศนี้ไม่มีอยู่แล้ว"
          action={
            <Button asChild variant="outline" className="h-10 px-4">
              <Link to="/my-pets">กลับไปที่สัตว์ของฉัน</Link>
            </Button>
          }
        />
      )
    }
    return (
      <div>
        <BackToMyPets />
        <ErrorState error={petQuery.error} onRetry={() => petQuery.refetch()} isRetrying={petQuery.isFetching} />
      </div>
    )
  }

  const forbidden = knownNotOwner || (appsQuery.error instanceof ApiError && appsQuery.error.statusCode === 403)
  if (forbidden) return <NotOwnerState />

  const loadedPet = petQuery.data
  const canApprove = loadedPet.status === 'available'

  let list
  if (appsQuery.isPending) {
    list = (
      <ul className="space-y-3" aria-busy="true" aria-label="กำลังโหลดคำขอ">
        {Array.from({ length: 2 }, (_, i) => (
          <li key={i} className="space-y-3 rounded-2xl border bg-card p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>
    )
  } else if (appsQuery.isError) {
    list = <ErrorState error={appsQuery.error} onRetry={() => appsQuery.refetch()} isRetrying={appsQuery.isFetching} />
  } else if (applications.length === 0) {
    list = (
      <EmptyState
        icon={<InboxIcon className="size-7" aria-hidden />}
        title="ยังไม่มีคำขอเข้ามา"
        description="เมื่อมีคนยื่นขอรับเลี้ยง คุณจะได้รับแจ้งเตือนและเห็นคำขอที่นี่"
      />
    )
  } else {
    list = (
      <ul className="space-y-3">
        {applications.map((a) => (
          <PetApplicationCard
            key={a.id}
            application={a}
            canApprove={canApprove}
            disabled={actions.isBusy}
            onApprove={(application) => setDialog({ kind: 'approve', application })}
            onReject={(application) => setDialog({ kind: 'reject', application })}
          />
        ))}
      </ul>
    )
  }

  // ปิดกล่องเมื่อ action จบ ไม่ว่าสำเร็จหรือไม่ (error เป็น toast และข้อมูลโหลดใหม่ให้เห็นสถานะจริง)
  const closeDialog = { onSettled: () => setDialog(null) }
  const otherPending = Math.max(0, pendingCount - 1)

  return (
    <div className="space-y-6">
      <div>
        <BackToMyPets />
        <ManagePetHeader pet={loadedPet} onClose={() => setDialog({ kind: 'close' })} disabled={actions.isBusy} />
      </div>

      <section aria-labelledby="applications-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="applications-heading" className="text-lg font-semibold">
            คำขอรับเลี้ยง
          </h2>
          {pendingCount > 0 && <p className="text-sm text-muted-foreground">รอพิจารณา {pendingCount} รายการ</p>}
        </div>
        {!canApprove && pendingCount > 0 && (
          <p className="text-sm text-muted-foreground">
            ประกาศนี้ปิดรับแล้ว จึงอนุมัติไม่ได้ แต่ยังปฏิเสธคำขอที่ค้างอยู่ได้
          </p>
        )}
        {list}
      </section>

      <ConfirmDialog
        open={dialog?.kind === 'approve'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.kind === 'approve' ? `อนุมัติให้ ${dialog.application.applicant_name} รับเลี้ยง?` : ''}
        description={
          otherPending > 0
            ? `คำขออื่นของ ${loadedPet.name} ที่ยังรออยู่ ${otherPending} รายการ จะถูกปฏิเสธอัตโนมัติ และน้องจะเปลี่ยนเป็น "มีบ้านแล้ว" ย้อนกลับไม่ได้`
            : `น้อง ${loadedPet.name} จะเปลี่ยนเป็น "มีบ้านแล้ว" และไม่รับคำขอใหม่อีก ย้อนกลับไม่ได้`
        }
        confirmLabel="อนุมัติ"
        pendingLabel="กำลังอนุมัติ…"
        isPending={actions.approve.isPending}
        onConfirm={() => dialog?.kind === 'approve' && actions.approve.mutate(dialog.application.id, closeDialog)}
      />

      <ConfirmDialog
        open={dialog?.kind === 'reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.kind === 'reject' ? `ปฏิเสธคำขอของ ${dialog.application.applicant_name}?` : ''}
        description="ผู้ยื่นจะได้รับแจ้งเตือนว่าไม่ได้รับเลือก ย้อนกลับไม่ได้"
        confirmLabel="ปฏิเสธ"
        pendingLabel="กำลังปฏิเสธ…"
        isPending={actions.reject.isPending}
        onConfirm={() => dialog?.kind === 'reject' && actions.reject.mutate(dialog.application.id, closeDialog)}
        destructive
      />

      <ConfirmDialog
        open={dialog?.kind === 'close'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`ปิดโพสต์ ${loadedPet.name}?`}
        description="ประกาศจะหายจากหน้ารายการและไม่รับคำขอใหม่ เปิดกลับไม่ได้ คำขอที่รออยู่ยังอยู่ในรายการนี้"
        confirmLabel="ปิดโพสต์"
        pendingLabel="กำลังปิด…"
        isPending={actions.close.isPending}
        onConfirm={() => actions.close.mutate(undefined, closeDialog)}
        destructive
      />
    </div>
  )
}
