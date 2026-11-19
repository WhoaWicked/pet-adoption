import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Header } from './Header'

// root layout ของทุกหน้า — AuthProvider อยู่ตรงนี้เพราะต้องใช้ useNavigate (ต้องอยู่ใน router)
export function AppLayout() {
  return (
    <AuthProvider>
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Outlet />
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          บ้านใหม่ — พื้นที่หาบ้านให้สัตว์เลี้ยง
        </footer>
      </div>
      <Toaster position="top-center" richColors={false} />
      <ScrollRestoration />
    </AuthProvider>
  )
}
