import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * กล่องยืนยันก่อนทำ action ที่ย้อนกลับไม่ได้ (ถอนคำขอ, อนุมัติ, ปิดโพสต์)
 * ควบคุม open จากภายนอก เพื่อให้ปิดกล่องเองหลัง action สำเร็จ ไม่ใช่ปิดทันทีที่กด
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
  destructive = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <AlertDialog
      open={open}
      // ระหว่างรอ API ห้ามปิดกล่อง (กันผู้ใช้คิดว่ายกเลิกได้ทั้งที่ request ส่งไปแล้ว)
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={(e) => {
              // ไม่ให้ Radix ปิดกล่องเอง — ผู้เรียกปิดเมื่อ action สำเร็จ
              e.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
