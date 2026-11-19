import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SPECIES_LABELS, SPECIES_OPTIONS } from '@/lib/constants/labels'
import { PROVINCES } from '@/lib/constants/provinces'
import type { PetFilters as Filters } from './use-pet-filters'

// Select ของ Radix ห้ามใช้ค่า "" → ใช้ "all" แทน "ทั้งหมด" แล้วแปลงเป็น undefined (ไม่ส่ง param)
const ALL = 'all'

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
    <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-species">ชนิดสัตว์</Label>
          <Select value={filters.species ?? ALL} onValueChange={(v) => onChange('species', toValue(v))}>
            <SelectTrigger id="filter-species" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทั้งหมด</SelectItem>
              {SPECIES_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SPECIES_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-province">จังหวัด</Label>
          <Select value={filters.province ?? ALL} onValueChange={(v) => onChange('province', toValue(v))}>
            <SelectTrigger id="filter-province" className="w-full">
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
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" className="px-3" onClick={onClear}>
          <XIcon aria-hidden />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
