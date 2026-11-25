import { CatIcon, DogIcon, PawPrintIcon, XIcon } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SPECIES_LABELS, SPECIES_OPTIONS } from '@/lib/constants/labels'
import { PROVINCES } from '@/lib/constants/provinces'
import type { Species } from '@/lib/types'
import type { PetFilters as Filters } from './use-pet-filters'

// Select ของ Radix ห้ามใช้ค่า "" → ใช้ "all" แทน "ทั้งหมด" แล้วแปลงเป็น undefined (ไม่ส่ง param)
// chip ชนิดสัตว์ใช้ค่า "all" แบบเดียวกัน
const ALL = 'all'

const SPECIES_ICONS: Record<Species, typeof DogIcon> = { dog: DogIcon, cat: CatIcon, other: PawPrintIcon }

const CHIP_CLASS =
  'inline-flex h-10 items-center gap-1.5 rounded-lg border border-field-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background'

// แถบตัวกรองบาง ๆ (ไม่มีกล่อง) — sticky ใต้ header ตอนเลื่อนลง
// พื้นและเส้นล่างยืดเต็มความกว้างจอด้วย box-shadow 2 ชั้น + clip-path (box-shadow ไม่ทำให้หน้าล้นแนวนอน)
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
  const toValue = (v: string) => (v === ALL ? undefined : v)

  return (
    <div className="sticky top-16 z-30 bg-background py-3 shadow-[0_0_0_100vmax_var(--color-background),0_1px_0_100vmax_var(--color-border)] [clip-path:inset(0_-100vmax_-1px)]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
            <SelectTrigger id="filter-province" className="w-48 sm:w-56">
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

        {hasActiveFilters && (
          <Button variant="ghost" className="px-3 sm:ml-auto" onClick={onClear}>
            <XIcon aria-hidden />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  )
}
