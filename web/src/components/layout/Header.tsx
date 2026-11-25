import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { LogOutIcon, MenuIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/auth-context'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  requiresAuth: boolean
}

// ลิงก์หลัก — ที่ต้อง login จะซ่อนไว้จนกว่าจะ login ("ลงประกาศ" แยกเป็นปุ่ม primary แสดงเสมอ)
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'หาบ้านให้น้อง', requiresAuth: false },
  { to: '/my-applications', label: 'คำขอของฉัน', requiresAuth: true },
  { to: '/saved', label: 'ที่บันทึกไว้', requiresAuth: true },
  { to: '/my-pets', label: 'สัตว์ของฉัน', requiresAuth: true },
]

// เมนู: หน้าปัจจุบัน = ตัวหนา + เส้นใต้สีหลัก 2px (ใช้ border-b แทน underline เพราะเส้นใต้ตัวอักษรชนสระล่างภาษาไทย)
function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'w-fit border-b-2 py-1.5 text-[0.95rem] transition-colors hover:text-foreground',
    isActive ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground',
  )
}

export function Header() {
  const { status, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isLoggedIn = status === 'authenticated'
  const items = NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* wordmark ตัวอักษรล้วนสีหลัก — ไม่ใช้ไอคอนอุ้งเท้าในวงกลมแบบแม่แบบ */}
        <Link to="/" className="text-xl font-bold text-primary">
          บ้านใหม่
        </Link>

        {/* เดสก์ท็อป */}
        <nav className="ml-8 hidden items-center gap-6 md:flex" aria-label="เมนูหลัก">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* กระดิ่งอยู่แถบบนทุกขนาดจอ (มือถืออยู่ข้างปุ่มเมนู) — แสดงเฉพาะตอน login */}
          {isLoggedIn && <NotificationBell />}
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/pets/new">
              <PlusIcon aria-hidden />
              ลงประกาศ
            </Link>
          </Button>

          <div className="hidden md:flex md:items-center md:gap-2">
            {status === 'anonymous' && (
              <>
                <Button asChild variant="ghost" className="px-3">
                  <Link to="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button asChild variant="outline" className="px-3">
                  <Link to="/register">สมัครสมาชิก</Link>
                </Button>
              </>
            )}
            {isLoggedIn && (
              <Button variant="ghost" className="px-3" onClick={logout}>
                <LogOutIcon aria-hidden />
                ออกจากระบบ
              </Button>
            )}
          </div>

          {/* มือถือ: ยุบเป็นเมนู */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="เปิดเมนู">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>เมนู</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 px-4" aria-label="เมนูหลัก">
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass} onClick={closeMenu}>
                    {item.label}
                  </NavLink>
                ))}
                <Button asChild className="mt-3">
                  <Link to="/pets/new" onClick={closeMenu}>
                    <PlusIcon aria-hidden />
                    ลงประกาศ
                  </Link>
                </Button>
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  {status === 'anonymous' && (
                    <>
                      <Button asChild variant="outline">
                        <Link to="/login" onClick={closeMenu}>เข้าสู่ระบบ</Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link to="/register" onClick={closeMenu}>สมัครสมาชิก</Link>
                      </Button>
                    </>
                  )}
                  {isLoggedIn && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        closeMenu()
                        logout()
                      }}
                    >
                      <LogOutIcon aria-hidden />
                      ออกจากระบบ
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
