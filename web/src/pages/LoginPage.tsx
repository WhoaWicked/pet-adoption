import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { AlertCircleIcon, InfoIcon, LoaderCircleIcon } from 'lucide-react'
import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/AuthCard'
import { useAuth } from '@/features/auth/auth-context'
import { DEFAULT_AFTER_AUTH, safeRedirect } from '@/features/auth/redirect'
import type { LoginInput } from '@/lib/api/endpoints'
import { getErrorMessage } from '@/lib/api/errors'
import { fieldAria, isValidEmail } from '@/lib/form'

type Field = 'email' | 'password'

function validate(values: LoginInput): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  if (!values.email.trim()) errors.email = 'กรุณากรอกอีเมล'
  else if (!isValidEmail(values.email.trim())) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!values.password) errors.password = 'กรุณากรอกรหัสผ่าน'
  return errors
}

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect'))
  const reason = searchParams.get('reason')
  const justRegistered = searchParams.get('registered') === '1'

  const [values, setValues] = useState<LoginInput>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({})

  const mutation = useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: () => navigate(redirectTo, { replace: true }),
  })

  // login อยู่แล้ว (เช่นกด back กลับมา) ไม่ต้องเห็นฟอร์มอีก — แต่ระหว่าง mutation ให้ onSuccess เป็นคนพาไป
  if (status === 'authenticated' && !mutation.isPending && !mutation.isSuccess) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || mutation.isPending) return
    mutation.mutate({ email: values.email.trim(), password: values.password })
  }

  const registerLink = redirectTo !== DEFAULT_AFTER_AUTH ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'

  return (
    <AuthCard
      title="ยินดีต้อนรับกลับมา"
      description="เข้าสู่ระบบเพื่อส่งคำขอและลงประกาศ"
      footer={
        <p>
          ยังไม่มีบัญชี?{' '}
          <Link to={registerLink} className="font-semibold text-primary underline-offset-4 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {justRegistered && !mutation.isError && (
          <Alert className="rounded-[1rem] px-3 py-2.5">
            <InfoIcon />
            <AlertDescription>สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ</AlertDescription>
          </Alert>
        )}
        {reason === 'expired' && !mutation.isError && !justRegistered && (
          <Alert className="rounded-[1rem] px-3 py-2.5">
            <InfoIcon />
            <AlertDescription>เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง</AlertDescription>
          </Alert>
        )}
        {mutation.isError && (
          <Alert variant="destructive" className="rounded-[1rem] px-3 py-2.5">
            <AlertCircleIcon />
            <AlertDescription>{getErrorMessage(mutation.error)}</AlertDescription>
          </Alert>
        )}

        <FormField id="email" label="อีเมล" error={fieldErrors.email}>
          <Input
            {...fieldAria('email', fieldErrors.email)}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
        </FormField>

        <FormField id="password" label="รหัสผ่าน" error={fieldErrors.password}>
          <Input
            {...fieldAria('password', fieldErrors.password)}
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          />
        </FormField>

        {/* ปุ่มหลักแคปซูลเต็มความกว้าง · ระหว่างส่ง: ไอคอนหมุน + ข้อความ "กำลัง…" และ disabled กันกดซ้ำ (เดิม) */}
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircleIcon className="motion-safe:animate-spin" aria-hidden />}
          {mutation.isPending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </Button>
      </form>
    </AuthCard>
  )
}
