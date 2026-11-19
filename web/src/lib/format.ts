// แปลงอายุเป็นเดือน → ข้อความอ่านง่าย เช่น "2 ปี 3 เดือน", "5 เดือน"
export function formatAge(ageMonths: number): string {
  if (ageMonths < 1) return 'น้อยกว่า 1 เดือน'
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  if (years === 0) return `${months} เดือน`
  if (months === 0) return `${years} ปี`
  return `${years} ปี ${months} เดือน`
}
