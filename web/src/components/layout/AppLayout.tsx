import { Link, Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Header } from './Header'

const FOOTER_LINKS = [
  { to: '/', label: 'หน้าแรก' },
  { to: '/pets', label: 'ดูน้อง ๆ' },
  { to: '/pets/new', label: 'ลงประกาศ' },
]

// root layout ของทุกหน้า — AuthProvider อยู่ตรงนี้เพราะต้องใช้ useNavigate (ต้องอยู่ใน router)
export function AppLayout() {
  return (
    <AuthProvider>
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Outlet />
        </main>
        {/* footer เรียบ ๆ ทุกหน้า: เส้นขอบบาง · ชื่อเว็บ · ลิงก์หลัก (ไม่มี social) */}
        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <Link to="/" className="font-heading text-lg font-bold text-primary">
                บ้านใหม่
              </Link>
              <p className="text-sm text-muted-foreground">พื้นที่หาบ้านให้สัตว์เลี้ยง</p>
            </div>
            <nav aria-label="ลิงก์ท้ายเว็บ">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </footer>
      </div>
      <Toaster position="top-center" richColors={false} />
      <ScrollRestoration />
    </AuthProvider>
  )
}
