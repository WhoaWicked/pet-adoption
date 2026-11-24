import { Loader2Icon, RotateCwIcon, SparklesIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getSummaryErrorMessage } from '@/lib/api/errors'
import type { AiSummary } from '@/lib/types'
import { useApplicationSummary } from './use-application-summary'

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-muted-foreground">{title}</h4>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item, i) => (
          <li key={i} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SummaryPanel({ summary }: { summary: AiSummary }) {
  return (
    <div className="space-y-3 rounded-xl bg-secondary/60 p-4 text-sm">
      <h3 className="flex items-center gap-1.5 font-semibold">
        <SparklesIcon className="size-4 text-primary" aria-hidden />
        สรุปคำขอ
      </h3>
      <p className="whitespace-pre-line break-words">{summary.overview}</p>
      <SummaryList title="จุดเด่น" items={summary.highlights} />
      <SummaryList title="ข้อควรพิจารณา" items={summary.concerns} />
      <p className="text-xs text-muted-foreground">สรุปโดย AI ใช้ประกอบการพิจารณาเท่านั้น</p>
    </div>
  )
}

// ส่วนสรุป AI ในการ์ดคำขอ pending: ยังไม่กด / กำลังสรุป / สำเร็จ / ล้มเหลว
// disabled = มีการอนุมัติ/ปฏิเสธ/ปิดโพสต์รออยู่ (ปิดเฉพาะปุ่มสรุป ไม่กระทบปุ่มตัดสิน)
export function ApplicationSummary({ applicationId, disabled }: { applicationId: string; disabled: boolean }) {
  const { summary, isLoading, error, summarize } = useApplicationSummary(applicationId)

  let content
  if (summary) {
    content = <SummaryPanel summary={summary} />
  } else if (isLoading) {
    content = (
      <Button variant="outline" size="sm" disabled>
        <Loader2Icon className="animate-spin" aria-hidden />
        กำลังสรุป…
      </Button>
    )
  } else if (error) {
    content = (
      <div className="space-y-2">
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden />
          <AlertDescription>{getSummaryErrorMessage(error)}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={summarize} disabled={disabled}>
          <RotateCwIcon aria-hidden />
          ลองใหม่
        </Button>
      </div>
    )
  } else {
    content = (
      <Button variant="outline" size="sm" onClick={summarize} disabled={disabled}>
        <SparklesIcon aria-hidden />
        สรุปด้วย AI
      </Button>
    )
  }

  return <div aria-live="polite">{content}</div>
}
