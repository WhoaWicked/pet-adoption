import type { ReactNode } from 'react'
import { PawPrintIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// กรอบการ์ดกลางจอของหน้า login / register
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-8">
      <Card className="gap-6 py-8">
        <CardHeader className="items-center px-6 text-center sm:px-8">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <PawPrintIcon className="size-6" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8">{children}</CardContent>
        <CardFooter className="justify-center border-t-0 bg-transparent px-6 text-sm text-muted-foreground sm:px-8">
          {footer}
        </CardFooter>
      </Card>
    </div>
  )
}
