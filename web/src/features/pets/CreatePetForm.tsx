import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage, getValidationErrors } from '@/lib/api/errors'
import { SPECIES_LABELS, SPECIES_OPTIONS } from '@/lib/constants/labels'
import { PROVINCES } from '@/lib/constants/provinces'
import { fieldAria } from '@/lib/form'
import type { Species } from '@/lib/types'
import { useCreatePet } from './use-create-pet'

// ชื่อ field ตาม CreatePetDto — ใช้จับคู่ details ของ validation error กับช่องกรอก
const FIELDS = ['name', 'species', 'ageMonths', 'province', 'description', 'requirements', 'imageUrl'] as const
type Field = (typeof FIELDS)[number]
type FieldErrors = Partial<Record<Field, string>>

interface Values {
  name: string
  species: Species | ''
  ageYears: string
  ageMonthsPart: string
  province: string
  description: string
  requirements: string
  imageUrl: string
}

const INITIAL: Values = {
  name: '',
  species: '',
  ageYears: '',
  ageMonthsPart: '',
  province: '',
  description: '',
  requirements: '',
  imageUrl: '',
}

const WHOLE_NUMBER = /^\d+$/

/** อายุกรอกเป็น "ปี" + "เดือน" (ช่องว่าง = 0) → รวมเป็นเดือนตามที่ API ต้องการ; ไม่ถูกต้องคืน null */
function toAgeMonths(years: string, months: string): number | null {
  const y = years.trim() || '0'
  const m = months.trim() || '0'
  if (!WHOLE_NUMBER.test(y) || !WHOLE_NUMBER.test(m)) return null
  const monthsNum = Number(m)
  if (monthsNum > 11) return null
  return Number(y) * 12 + monthsNum
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.name.trim()) errors.name = 'กรุณากรอกชื่อน้อง'
  if (!values.species) errors.species = 'กรุณาเลือกชนิดสัตว์'
  if (!values.ageYears.trim() && !values.ageMonthsPart.trim()) errors.ageMonths = 'กรุณากรอกอายุโดยประมาณ'
  else if (toAgeMonths(values.ageYears, values.ageMonthsPart) === null)
    errors.ageMonths = 'อายุต้องเป็นจำนวนเต็ม และเดือนต้องอยู่ระหว่าง 0–11'
  if (!values.province) errors.province = 'กรุณาเลือกจังหวัด'
  if (!values.description.trim()) errors.description = 'กรุณาเล่าเกี่ยวกับน้อง'
  if (!values.requirements.trim()) errors.requirements = 'กรุณาระบุเงื่อนไขการรับเลี้ยง'
  if (values.imageUrl.trim() && !isHttpUrl(values.imageUrl.trim()))
    errors.imageUrl = 'ลิงก์รูปต้องขึ้นต้นด้วย http:// หรือ https://'
  return errors
}

// ฟอร์มลงประกาศหาบ้านให้สัตว์ (ตาม CreatePetDto)
export function CreatePetForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>(INITIAL)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const mutation = useCreatePet()

  const set = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || mutation.isPending) return

    mutation.mutate(
      {
        name: values.name.trim(),
        species: values.species as Species,
        ageMonths: toAgeMonths(values.ageYears, values.ageMonthsPart)!,
        province: values.province,
        description: values.description.trim(),
        requirements: values.requirements.trim(),
        imageUrl: values.imageUrl,
      },
      {
        onSuccess: (pet) => {
          toast.success(`ลงประกาศ ${pet.name} แล้ว`)
          // หน้าจัดการ (/my-pets/:petId) ยังไม่พร้อม → ไปหน้ารายละเอียดของตัวที่สร้าง
          navigate(`/pets/${pet.id}`, { replace: true })
        },
        onError: (err) => setFieldErrors(getValidationErrors(err, FIELDS).fieldErrors),
      },
    )
  }

  const formError = mutation.isError
    ? getValidationErrors(mutation.error, FIELDS).formError ??
      (Object.keys(fieldErrors).length === 0 ? getErrorMessage(mutation.error) : undefined)
    : undefined

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FormField id="name" label="ชื่อน้อง" error={fieldErrors.name}>
        <Input {...fieldAria('name', fieldErrors.name)} className="h-11" value={values.name} onChange={set('name')} />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="species" label="ชนิดสัตว์" error={fieldErrors.species}>
          <Select value={values.species} onValueChange={(v) => setValues((s) => ({ ...s, species: v as Species }))}>
            <SelectTrigger {...fieldAria('species', fieldErrors.species)} className="h-11 w-full">
              <SelectValue placeholder="เลือกชนิดสัตว์" />
            </SelectTrigger>
            <SelectContent>
              {SPECIES_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SPECIES_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="province" label="จังหวัด" error={fieldErrors.province}>
          <Select value={values.province} onValueChange={(v) => setValues((s) => ({ ...s, province: v }))}>
            <SelectTrigger {...fieldAria('province', fieldErrors.province)} className="h-11 w-full">
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* อายุ: 2 ช่องแต่เป็น field เดียวของ API (ageMonths) จึงแสดง error ใต้กลุ่ม */}
      <fieldset className="space-y-2" aria-describedby={fieldErrors.ageMonths ? 'ageMonths-error' : 'ageMonths-hint'}>
        <legend className="text-sm font-medium">อายุโดยประมาณ</legend>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div className="space-y-1">
            <Label htmlFor="ageYears" className="text-xs font-normal text-muted-foreground">ปี</Label>
            <Input
              id="ageYears"
              inputMode="numeric"
              placeholder="0"
              className="h-11"
              aria-invalid={fieldErrors.ageMonths ? true : undefined}
              value={values.ageYears}
              onChange={set('ageYears')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ageMonthsPart" className="text-xs font-normal text-muted-foreground">เดือน</Label>
            <Input
              id="ageMonthsPart"
              inputMode="numeric"
              placeholder="0"
              className="h-11"
              aria-invalid={fieldErrors.ageMonths ? true : undefined}
              value={values.ageMonthsPart}
              onChange={set('ageMonthsPart')}
            />
          </div>
        </div>
        {fieldErrors.ageMonths ? (
          <p id="ageMonths-error" className="text-sm text-destructive">{fieldErrors.ageMonths}</p>
        ) : (
          <p id="ageMonths-hint" className="text-xs text-muted-foreground">เช่น 1 ปี 6 เดือน หรือกรอกเฉพาะเดือนสำหรับลูกสัตว์</p>
        )}
      </fieldset>

      <FormField id="description" label="เกี่ยวกับน้อง" error={fieldErrors.description}>
        <Textarea
          {...fieldAria('description', fieldErrors.description)}
          rows={4}
          placeholder="นิสัย สุขภาพ การฉีดวัคซีน/ทำหมัน"
          value={values.description}
          onChange={set('description')}
        />
      </FormField>

      <FormField id="requirements" label="เงื่อนไขการรับเลี้ยง" error={fieldErrors.requirements}>
        <Textarea
          {...fieldAria('requirements', fieldErrors.requirements)}
          rows={3}
          placeholder="เช่น ต้องเลี้ยงในบ้าน ยินดีให้ติดตามผลหลังรับเลี้ยง"
          value={values.requirements}
          onChange={set('requirements')}
        />
      </FormField>

      <FormField
        id="imageUrl"
        label="ลิงก์รูปน้อง (ไม่บังคับ)"
        error={fieldErrors.imageUrl}
        hint="วางลิงก์รูปที่อัปโหลดไว้ที่อื่น ถ้าไม่มีจะแสดงรูปตัวอย่างแทน"
      >
        <Input
          {...fieldAria('imageUrl', fieldErrors.imageUrl, true)}
          type="url"
          inputMode="url"
          placeholder="https://"
          className="h-11"
          value={values.imageUrl}
          onChange={set('imageUrl')}
        />
      </FormField>

      <Button type="submit" className="h-11 w-full text-base sm:w-auto sm:px-8" disabled={mutation.isPending}>
        {mutation.isPending ? 'กำลังลงประกาศ…' : 'ลงประกาศ'}
      </Button>
    </form>
  )
}
