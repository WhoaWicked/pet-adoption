import { ClipboardCheckIcon, SearchIcon, SendIcon } from 'lucide-react'
import { Reveal } from './Reveal'

// "ทำงานยังไง": 3 ขั้นตามที่ระบบทำจริง
// เลือกน้อง (ดู/กรองได้โดยไม่ต้อง login) → ส่งคำขอ (ต้อง login, ตอบคำถาม) → เจ้าของอนุมัติ/ปฏิเสธเอง + แจ้งเตือนในเว็บ
const STEPS = [
  {
    icon: SearchIcon,
    title: 'เลือกน้อง',
    body: 'ดูโปรไฟล์น้อง ๆ ที่กำลังรอบ้าน กรองตามชนิดสัตว์หรือจังหวัดที่สะดวก แล้วอ่านนิสัยและสิ่งที่เจ้าของอยากได้จากบ้านใหม่',
  },
  {
    icon: SendIcon,
    title: 'ส่งคำขอรับเลี้ยง',
    body: 'เข้าสู่ระบบแล้วตอบคำถามสั้น ๆ เกี่ยวกับตัวคุณและที่พักจากหน้าของน้อง ติดตามสถานะได้ในหน้า "คำขอของฉัน"',
  },
  {
    icon: ClipboardCheckIcon,
    title: 'เจ้าของพิจารณา',
    body: 'เจ้าของอ่านคำขอแล้วเลือกอนุมัติหรือปฏิเสธด้วยตัวเอง เมื่อมีผลคุณจะได้รับแจ้งเตือนในเว็บทันที',
  },
]

// การ์ดเท่ากัน 3 ใบ: ขอบ 1px โค้ง 20px ไม่มีเงา · ไอคอนเส้นบางวางตรง ๆ ไม่มีกล่องซ้อน
export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="py-16 lg:py-24">
      <Reveal className="text-center">
        <h2 id="how-heading" className="text-3xl font-bold sm:text-4xl">
          {/* แบ่งวลีเป็น inline-block → จอแคบตัดบรรทัดตรงรอยต่อวลี ไม่ใช่ "ยัง / ไง" */}
          <span className="inline-block">รับน้องกลับบ้าน</span>
          <span className="inline-block">ทำงานยังไง</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">สามขั้นตอนตั้งแต่เจอน้องที่ถูกใจ จนรู้ผลคำขอ</p>
      </Reveal>
      <Reveal className="mt-10 lg:mt-12">
        <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex flex-col rounded-[1.25rem] border bg-card p-6 transition-colors hover:border-field-border/50 lg:p-8"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-7 text-primary" strokeWidth={1.5} aria-hidden />
                <span className="rounded-full bg-status-available px-2.5 py-0.5 text-xs font-medium text-status-available-foreground">
                  ขั้นที่ {i + 1}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
