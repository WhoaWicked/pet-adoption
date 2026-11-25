# Plan: soft-fields — ช่องกรอกทั้งเว็บอ่อนลงและเป็นชุดเดียวกัน

branch: `claude/chore/ui-friendly` · ผู้ใช้อนุมัติให้ implement ได้เลย · ไม่ commit

## token (`index.css`)
- ใช้ `--input` (ความหมายเดิมของ shadcn = ขอบช่องกรอก) เป็นขอบปกติ: `#d3dde7` → `#c3cfdb` · เพิ่ม `--input-hover: #a9b8c7`
- **ไม่แตะ `--field-border`** เพราะปุ่มแคปซูลรองทั้งเว็บใช้ `border-field-border/50` (~20 ไฟล์) ถ้าอ่อนลงขอบปุ่มจะหายไป

## contrast (ผู้ใช้รับทราบว่าขอบต่ำกว่า 3:1)
| สี | บนขาว | บนพื้นหน้า #F5F8FB |
|---|---|---|
| ขอบปกติ `#C3CFDB` | 1.58:1 | 1.48:1 |
| hover `#A9B8C7` | 2.03:1 | 1.90:1 |
| focus `#1F6FB2` | 5.28:1 | 4.96:1 |
| (เดิม `#8494A3`) | 3.11:1 | 2.92:1 |
- placeholder: `muted-foreground/85` = #6F7E8C → 4.17:1 บนขาว (เดิม 5.82:1)
- ลูกศร select / ตัวอักษร disabled: `muted-foreground` 5.82:1 / 5.08:1 บน muted

## ช่องกรอก (`ui/input`, `ui/select` trigger, `ui/textarea`, `ui/radio-group`)
- ปกติ: ขอบ `border-input` พื้นขาว ไม่มีเงา · สูง 44px (`h-11`) · `px-4` · `text-base` ทุกขนาดจอ (เอา `md:text-sm` ออก)
- hover: `border-input-hover` · transition สี/ขอบ/ring 150ms
- focus: ขอบ `primary` + `ring-3 ring-primary/20` (select: ตอนเปิด `data-[state=open]` ใช้แบบเดียวกัน)
- error (`aria-invalid`): ขอบ `destructive` + `ring-3 ring-destructive/20` (ทั้งตอนปกติและตอน focus) · ข้อความ error ใต้ช่องเดิม
- disabled: พื้น `muted` ตัวอักษร `muted-foreground` ไม่มี opacity ซ้อน
- radio: ขอบ input → hover input-hover → focus ring primary/20 · เลือกแล้วพื้น primary (เดิม)
- ไม่แก้ layout ฟอร์ม/ฟิลด์/validation/ข้อความ (ความสูงช่อง 40→44px ตาม brief)
