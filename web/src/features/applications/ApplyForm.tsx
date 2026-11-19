import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AlertCircleIcon, CircleCheckIcon } from 'lucide-react'
import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage, getValidationErrors } from '@/lib/api/errors'
import { HOUSING_TYPE_LABELS } from '@/lib/constants/labels'
import { fieldAria } from '@/lib/form'
import type { HousingType } from '@/lib/types'
import { isConflict, useCreateApplication } from './use-create-application'

const NOTE_MAX = 500 // ตรงกับ @MaxLength(500) ใน AnswersDto
const HOUSING_OPTIONS = Object.keys(HOUSING_TYPE_LABELS) as HousingType[]
const FIELDS = ['housingType', 'hasPetExperience', 'note'] as const
type Field = (typeof FIELDS)[number]
type FieldErrors = Partial<Record<Field, string>>

interface Values {
  housingType: HousingType | ''
  hasPetExperience: 'yes' | 'no' | ''
  note: string
}

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.housingType) errors.housingType = 'กรุณาเลือกประเภทที่พักอาศัย'
  if (!values.hasPetExperience) errors.hasPetExperience = 'กรุณาเลือกว่าเคยเลี้ยงสัตว์มาก่อนหรือไม่'
  if (values.note.length > NOTE_MAX) errors.note = `ต้องไม่เกิน ${NOTE_MAX} ตัวอักษร`
  return errors
}

// ฟอร์มยื่นคำขอรับเลี้ยง (answers: housingType, hasPetExperience, note)
export function ApplyForm({ petId, petName }: { petId: string; petName: string }) {
  const [values, setValues] = useState<Values>({ housingType: '', hasPetExperience: '', note: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const mutation = useCreateApplication(petId)

  if (mutation.isSuccess) {
    return (
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>ส่งคำขอรับเลี้ยง {petName} แล้ว</AlertTitle>
        <AlertDescription>
          <p>เจ้าของโพสต์จะได้รับแจ้งเตือน และคุณจะได้รับแจ้งเตือนเมื่อมีการตัดสิน</p>
          <Link to="/my-applications" className="font-medium text-primary underline-offset-4 hover:underline">
            ดูคำขอของฉัน
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || mutation.isPending) return
    mutation.mutate(
      {
        housingType: values.housingType as HousingType,
        hasPetExperience: values.hasPetExperience === 'yes',
        note: values.note,
      },
      {
        // validation จาก API → แสดงใต้ช่องที่เกี่ยวข้อง
        onError: (err) => setFieldErrors(getValidationErrors(err, FIELDS).fieldErrors),
      },
    )
  }

  // 409 แสดงเป็น toast จาก useCreateApplication แล้ว (กันข้อความซ้ำ)
  const formError = mutation.isError && !isConflict(mutation.error)
    ? getValidationErrors(mutation.error, FIELDS).formError ??
      (Object.keys(fieldErrors).length === 0 ? getErrorMessage(mutation.error) : undefined)
    : undefined

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FormField id="housingType" label="ที่พักอาศัยของคุณ" error={fieldErrors.housingType}>
        <Select
          value={values.housingType}
          onValueChange={(v) => setValues((s) => ({ ...s, housingType: v as HousingType }))}
        >
          <SelectTrigger {...fieldAria('housingType', fieldErrors.housingType)} className="h-10 w-full">
            <SelectValue placeholder="เลือกประเภทที่พัก" />
          </SelectTrigger>
          <SelectContent>
            {HOUSING_OPTIONS.map((h) => (
              <SelectItem key={h} value={h}>
                {HOUSING_TYPE_LABELS[h]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <fieldset className="space-y-2" aria-describedby={fieldErrors.hasPetExperience ? 'hasPetExperience-error' : undefined}>
        <legend className="text-sm font-medium">เคยเลี้ยงสัตว์มาก่อนไหม</legend>
        <RadioGroup
          value={values.hasPetExperience}
          onValueChange={(v) => setValues((s) => ({ ...s, hasPetExperience: v as 'yes' | 'no' }))}
          className="flex gap-6 pt-1"
          aria-invalid={fieldErrors.hasPetExperience ? true : undefined}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="exp-yes" />
            <Label htmlFor="exp-yes" className="font-normal">เคย</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="exp-no" />
            <Label htmlFor="exp-no" className="font-normal">ไม่เคย</Label>
          </div>
        </RadioGroup>
        {fieldErrors.hasPetExperience && (
          <p id="hasPetExperience-error" className="text-sm text-destructive">
            {fieldErrors.hasPetExperience}
          </p>
        )}
      </fieldset>

      <FormField id="note" label="เล่าเพิ่มเติมให้เจ้าของฟัง (ไม่บังคับ)" error={fieldErrors.note}>
        <Textarea
          {...fieldAria('note', fieldErrors.note)}
          rows={4}
          maxLength={NOTE_MAX}
          placeholder="เช่น มีเวลาดูแลแค่ไหน มีสัตว์ตัวอื่นที่บ้านไหม"
          value={values.note}
          onChange={(e) => setValues((s) => ({ ...s, note: e.target.value }))}
        />
        <p className="text-right text-xs text-muted-foreground" aria-live="polite">
          {values.note.length}/{NOTE_MAX}
        </p>
      </FormField>

      <Button type="submit" className="h-11 w-full text-base" disabled={mutation.isPending}>
        {mutation.isPending ? 'กำลังส่งคำขอ…' : 'ยื่นคำขอรับเลี้ยง'}
      </Button>
    </form>
  )
}
