import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'
import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/AuthCard'
import { useAuth } from '@/features/auth/auth-context'
import { safeRedirect } from '@/features/auth/redirect'
import { register, type RegisterInput } from '@/lib/api/endpoints'
import { getErrorMessage, getValidationErrors } from '@/lib/api/errors'
import { fieldAria, isValidEmail, PASSWORD_MIN_LENGTH } from '@/lib/form'

const FIELDS = ['displayName', 'email', 'password'] as const
type Field = (typeof FIELDS)[number]
type FieldErrors = Partial<Record<Field, string>>

function validate(values: RegisterInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.displayName.trim()) errors.displayName = 'กรุณากรอกชื่อที่ใช้แสดง'
  if (!values.email.trim()) errors.email = 'กรุณากรอกอีเมล'
  else if (!isValidEmail(values.email.trim())) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`
  return errors
}

export function RegisterPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect'))

  const [values, setValues] = useState<RegisterInput>({ displayName: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      await register(input)
      // register ไม่คืน token → login ต่อให้อัตโนมัติด้วยข้อมูลเดิม
      try {
        await login({ email: input.email, password: input.password })
        return 'logged-in' as const
      } catch {
        return 'registered-only' as const
      }
    },
    onSuccess: (result) => {
      if (result === 'logged-in') {
        navigate(redirectTo, { replace: true })
        return
      }
      // สมัครได้แต่ login อัตโนมัติไม่สำเร็จ → ให้ไป login เอง
      const params = new URLSearchParams({ registered: '1' })
      if (redirectTo !== '/') params.set('redirect', redirectTo)
      navigate(`/login?${params.toString()}`, { replace: true })
    },
    onError: (err) => {
      // validation จาก API → แสดงใต้ช่องที่เกี่ยวข้อง
      setFieldErrors(getValidationErrors(err, FIELDS).fieldErrors)
    },
  })

  if (status === 'authenticated' && !mutation.isPending && !mutation.isSuccess) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || mutation.isPending) return
    mutation.mutate({ displayName: values.displayName.trim(), email: values.email.trim(), password: values.password })
  }

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))

  // อีเมลซ้ำ: API ตอบ 409 (unique violation) → บอกให้ชัดว่าอีเมลถูกใช้แล้ว
  const formError = mutation.isError
    ? getValidationErrors(mutation.error, FIELDS).formError ??
      (Object.keys(fieldErrors).length === 0 ? getErrorMessage(mutation.error, { overrides: { 409: 'อีเมลนี้ถูกใช้สมัครแล้ว ลองเข้าสู่ระบบหรือใช้อีเมลอื่น' } }) : undefined)
    : undefined

  const loginLink = redirectTo !== '/' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'

  return (
    <AuthCard
      title="สมัครสมาชิก"
      description="สร้างบัญชีเดียว ใช้ได้ทั้งลงประกาศหาบ้านและขอรับเลี้ยง"
      footer={
        <p>
          มีบัญชีแล้ว?{' '}
          <Link to={loginLink} className="font-medium text-primary underline-offset-4 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField id="displayName" label="ชื่อที่ใช้แสดง" error={fieldErrors.displayName}>
          <Input
            {...fieldAria('displayName', fieldErrors.displayName)}
            autoComplete="nickname"
            value={values.displayName}
            onChange={update('displayName')}
          />
        </FormField>

        <FormField id="email" label="อีเมล" error={fieldErrors.email}>
          <Input
            {...fieldAria('email', fieldErrors.email)}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={update('email')}
          />
        </FormField>

        <FormField
          id="password"
          label="รหัสผ่าน"
          error={fieldErrors.password}
          hint={`อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`}
        >
          <Input
            {...fieldAria('password', fieldErrors.password, true)}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update('password')}
          />
        </FormField>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'กำลังสมัครสมาชิก…' : 'สมัครสมาชิก'}
        </Button>
      </form>
    </AuthCard>
  )
}
