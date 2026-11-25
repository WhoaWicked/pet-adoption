// "ทำงานยังไง": 3 ขั้นตามที่ระบบทำจริง (ยื่นคำขอ → เจ้าของอนุมัติ/ปฏิเสธ → แจ้งเตือนในเว็บ)
// เป็นลำดับจริงจึงใช้ตัวเลข · ไม่มีกล่องรอบแต่ละขั้น ใช้เส้นบางด้านบนแบ่งจังหวะแทน
const STEPS = [
  {
    title: 'เลือกน้อง',
    body: 'ดูโปรไฟล์น้อง ๆ แล้วกรองตามชนิดสัตว์หรือจังหวัดที่สะดวก',
  },
  {
    title: 'ส่งคำขอรับเลี้ยง',
    body: 'ตอบคำถามสั้น ๆ เกี่ยวกับตัวคุณและบ้าน จากหน้าของน้องตัวนั้น',
  },
  {
    title: 'เจ้าของพิจารณา',
    body: 'เจ้าของอ่านคำขอแล้วตัดสินใจเอง คุณจะได้รับแจ้งเตือนในเว็บเมื่อมีผล',
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="py-16 lg:py-24">
      <h2 id="how-heading" className="text-3xl font-bold sm:text-4xl">
        ทำงานยังไง
      </h2>
      <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
        {STEPS.map((step, i) => (
          <li key={step.title} className="border-t border-border pt-6">
            <span aria-hidden className="block font-heading text-5xl leading-none font-bold text-primary">
              {i + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 max-w-xs text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
