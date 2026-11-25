import { useState } from 'react'
import { CatIcon, DogIcon, PawPrintIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SPECIES_LABELS, SPECIES_OPTIONS } from '@/lib/constants/labels'
import { PROVINCES } from '@/lib/constants/provinces'
import type { Species } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { PetFilters as Filters } from './use-pet-filters'

// Select ของ Radix ห้ามใช้ค่า "" → ใช้ "all" แทน "ทั้งหมด" แล้วแปลงเป็น undefined (ไม่ส่ง param)
// chip ชนิดสัตว์ใช้ค่า "all" แบบเดียวกัน
const ALL = 'all'

const SPECIES_ICONS: Record<Species, typeof DogIcon> = { dog: DogIcon, cat: CatIcon, other: PawPrintIcon }

// ชิปแคปซูลตาม DESIGN.md: ปกติพื้นขาวขอบเทาอ่อน · เลือกแล้วโทน primary อ่อน (ตัวอักษร 4.6:1)
const CHIP_CLASS =
  'inline-flex h-10 items-center gap-1.5 rounded-full border border-field-border/50 bg-card px-4 text-sm font-medium text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary'

// แถบตัวกรองบาง ๆ (ไม่มีกล่อง) — sticky ใต้ header ตอนเลื่อนลง
// พื้นและเส้นล่างยืดเต็มความกว้างจอด้วย box-shadow 2 ชั้น + clip-path (box-shadow ไม่ทำให้หน้าล้นแนวนอน)
// - จอ md ขึ้นไป: ตัวกรองทั้งหมดบรรทัดเดียว
// - มือถือ: ย่อเป็นปุ่ม "ตัวกรอง (n)" กดแล้วกางแผง — open เป็น state ฝั่ง UI ล้วน
//   ตัวควบคุมมีชุดเดียว (แค่ซ่อน/แสดงด้วย CSS) → filter ยังเรียก onChange/onClear เหมือนเดิมทุกอย่าง
export function PetFilters({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: {
  filters: Filters
  onChange: (key: 'species' | 'province', value: string | undefined) => void
  onClear: () => void
  hasActiveFilters: boolean
}) {
  const [open, setOpen] = useState(false)
  const toValue = (v: string) => (v === ALL ? undefined : v)
  const activeCount = (filters.species ? 1 : 0) + (filters.province ? 1 : 0)

  const clearButton = (
    <Button variant="ghost" className="rounded-full px-3" onClick={onClear}>
      <XIcon aria-hidden />
      ล้างตัวกรอง
    </Button>
  )

  return (
    <div className="sticky top-16 z-30 bg-background py-3 shadow-[0_0_0_100vmax_var(--color-background),0_1px_0_100vmax_var(--color-border)] [clip-path:inset(0_-100vmax_-1px)]">
      {/* มือถือ: ปุ่มกาง/หุบแผงตัวกรอง + ล้างตัวกรอง */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <Button
          variant="outline"
          className="rounded-full border-field-border/50 bg-card px-4"
          aria-expanded={open}
          aria-controls="pet-filters-panel"
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontalIcon strokeWidth={1.75} aria-hidden />
          {activeCount > 0 ? `ตัวกรอง (${activeCount})` : 'ตัวกรอง'}
        </Button>
        {hasActiveFilters && clearButton}
      </div>

      <div
        id="pet-filters-panel"
        className={cn(
          open ? 'flex' : 'hidden',
          'mt-3 flex-col gap-4 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3',
        )}
      >
        {/* ชนิดสัตว์: chip แบบ radio (Radix ให้ role="radiogroup" + ปุ่มลูกศรเลื่อนตัวเลือก) */}
        <RadioGroup.Root
          aria-label="ชนิดสัตว์"
          orientation="horizontal"
          value={filters.species ?? ALL}
          onValueChange={(v) => onChange('species', toValue(v))}
          className="flex flex-wrap gap-2"
        >
          <RadioGroup.Item value={ALL} className={CHIP_CLASS}>
            ทั้งหมด
          </RadioGroup.Item>
          {SPECIES_OPTIONS.map((s) => {
            const Icon = SPECIES_ICONS[s]
            return (
              <RadioGroup.Item key={s} value={s} className={CHIP_CLASS}>
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                {SPECIES_LABELS[s]}
              </RadioGroup.Item>
            )
          })}
        </RadioGroup.Root>

        <div className="flex items-center gap-2">
          <Label htmlFor="filter-province" className="shrink-0 text-muted-foreground">
            จังหวัด
          </Label>
          <Select value={filters.province ?? ALL} onValueChange={(v) => onChange('province', toValue(v))}>
            <SelectTrigger id="filter-province" className="w-full rounded-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={ALL}>ทุกจังหวัด</SelectItem>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* จอใหญ่: ล้างตัวกรองชิดขวาของแถบ (มือถืออยู่ข้างปุ่ม "ตัวกรอง" แล้ว) */}
        {hasActiveFilters && <div className="hidden md:ml-auto md:block">{clearButton}</div>}
      </div>
    </div>
  )
}
