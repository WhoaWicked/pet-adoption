import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

// label + ช่องกรอก + ข้อความช่วย/ข้อความ error ใต้ช่อง (ผูก aria ให้ screen reader อ่าน error ได้)
export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
