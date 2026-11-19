// แปลงอายุเป็นเดือน → ข้อความอ่านง่าย เช่น "2 ปี 3 เดือน", "5 เดือน"
export function formatAge(ageMonths: number): string {
  if (ageMonths < 1) return 'น้อยกว่า 1 เดือน'
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  if (years === 0) return `${months} เดือน`
  if (months === 0) return `${years} ปี`
  return `${years} ปี ${months} เดือน`
}

const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

// วันที่จาก API (ISO string) → "19 พ.ย. 2569"
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date)
}

// เวลาแบบสัมพัทธ์สำหรับแจ้งเตือน: "เมื่อสักครู่", "5 นาทีที่แล้ว" … เกิน 7 วันแสดงเป็นวันที่
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return '-'
  const minutes = Math.floor(Math.max(0, now - time) / 60_000)
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วันที่แล้ว`
  return formatDate(iso)
}
