import { LoaderCircleIcon, RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSummaryErrorMessage } from '@/lib/api/errors'
import type { AiSummary } from '@/lib/types'
import { useApplicationSummary } from './use-application-summary'

// ปุ่มในส่วนสรุป: ขนาด/ตำแหน่งเดียวกันทุกสถานะ (ยังไม่สรุป / กำลังสรุป / ลองใหม่) → layout ไม่กระโดด
const SUMMARY_BUTTON = 'rounded-full border-field-border/50 bg-card px-4'

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1.5">
      <h4 className="font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ผลสรุปตามโครงสร้าง AiSummary: ภาพรวม → จุดเด่น → ข้อควรพิจารณา (ไม่มีกล่องซ้อน)
function SummaryContent({ summary }: { summary: AiSummary }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p className="max-w-prose whitespace-pre-line break-words">{summary.overview}</p>
      <SummaryList title="จุดเด่น" items={summary.highlights} />
      <SummaryList title="ข้อควรพิจารณา" items={summary.concerns} />
      <p className="text-xs text-muted-foreground">สรุปโดย AI ใช้ประกอบการพิจารณาเท่านั้น</p>
    </div>
  )
}

// ส่วนสรุป AI ในบล็อกคำขอ pending: ยังไม่กด / กำลังสรุป / สำเร็จ / ล้มเหลว
// อยู่ในบล็อกเดียวกับคำขอ คั่นด้วยเส้นบน (ไม่ใช่กล่องซ้อน) · หัวมีป้ายตัวหนังสือ "สรุปโดย AI" (ไม่ใช้ไอคอน)
// disabled = มีการอนุมัติ/ปฏิเสธ/ปิดโพสต์รออยู่ (ปิดเฉพาะปุ่มสรุป ไม่กระทบปุ่มตัดสิน)
export function ApplicationSummary({ applicationId, disabled }: { applicationId: string; disabled: boolean }) {
  const { summary, isLoading, error, summarize } = useApplicationSummary(applicationId)

  let content
  if (summary) {
    // ผลสรุปที่เพิ่งปรากฏกางออกนุ่ม ๆ (grid 0fr → 1fr + fade, 300ms) ด้วย @starting-style — เล่นตอน mount ครั้งเดียว
    content = (
      <div className="grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out starting:grid-rows-[0fr] starting:opacity-0">
        <div className="min-h-0 overflow-hidden">
          <SummaryContent summary={summary} />
        </div>
      </div>
    )
  } else if (isLoading) {
    content = (
      <Button variant="outline" size="sm" className={SUMMARY_BUTTON} disabled>
        <LoaderCircleIcon className="motion-safe:animate-spin" aria-hidden />
        กำลังสรุป…
      </Button>
    )
  } else if (error) {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{getSummaryErrorMessage(error)}</p>
        <Button variant="outline" size="sm" className={SUMMARY_BUTTON} onClick={summarize} disabled={disabled}>
          <RotateCwIcon aria-hidden />
          ลองใหม่
        </Button>
      </div>
    )
  } else {
    content = (
      <Button variant="outline" size="sm" className={SUMMARY_BUTTON} onClick={summarize} disabled={disabled}>
        สรุปด้วย AI
      </Button>
    )
  }

  return (
    <section className="space-y-3 border-t pt-5" aria-label="สรุปคำขอโดย AI">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">สรุปคำขอ</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">สรุปโดย AI</span>
      </div>
      <div aria-live="polite">{content}</div>
    </section>
  )
}
