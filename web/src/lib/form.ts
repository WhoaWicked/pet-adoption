// ตัวช่วยเล็ก ๆ สำหรับฟอร์ม

/** props ของช่องกรอกที่ผูกกับ <FormField> (id + aria สำหรับ error/hint) */
export function fieldAria(id: string, error?: string, hasHint = false) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export const PASSWORD_MIN_LENGTH = 8
