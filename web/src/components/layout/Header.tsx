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
  { to: '/pets', label: 'หาบ้านให้น้อง', requiresAuth: false },
  { to: '/my-applications', label: 'คำขอของฉัน', requiresAuth: true },
  { to: '/saved', label: 'ที่บันทึกไว้', requiresAuth: true },
  { to: '/my-pets', label: 'สัตว์ของฉัน', requiresAuth: true },
]

// เมนู: หน้าปัจจุบัน = ตัวหนา + เส้นใต้สีหลัก 2px
// เส้นใต้วาดด้วย after: ชิดล่าง — ใช้ border-b ไม่ได้เพราะ rounded-sm ทำให้ปลายเส้นโค้งเรียว (underline ก็ชนสระล่างภาษาไทย)
// เส้นขยายจากกึ่งกลาง: active = สีเต็ม · ชี้เมาส์ลิงก์อื่น = สีจาง · ไม่ใส่ motion-safe (เจ้าของโปรเจกต์ตัดสินใจ)
// pb-2 = ระยะล่างเดิม 6px + ที่ว่าง 2px ของเส้น ความสูงลิงก์จึงเท่าเดิม
function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative w-fit rounded-sm pt-1.5 pb-2 text-[0.95rem] transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
    'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:transition-transform after:duration-200 after:ease-out',
    isActive
      ? 'font-semibold text-foreground after:scale-x-100 after:bg-primary'
      : 'text-muted-foreground after:scale-x-0 after:bg-primary/40 hover:after:scale-x-100',
  )
}

// ซ้อนข้อความตัวหนาแบบมองไม่เห็นไว้ ลิงก์จึงกว้างเท่ากันทั้งตอน active และไม่ active (เมนูข้าง ๆ ไม่ขยับ)
function NavLabel({ text }: { text: string }) {
  return (
    <span className="grid justify-items-center">
      <span className="col-start-1 row-start-1">{text}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
        {text}
      </span>
    </span>
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
        <Link to="/" className="rounded-sm text-xl font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          บ้านใหม่
        </Link>

        {/* เดสก์ท็อป */}
        <nav className="ml-8 hidden items-center gap-6 md:flex" aria-label="เมนูหลัก">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/pets'} className={navLinkClass}>
              <NavLabel text={item.label} />
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* กระดิ่งอยู่แถบบนทุกขนาดจอ (มือถืออยู่ข้างปุ่มเมนู) — แสดงเฉพาะตอน login */}
          {isLoggedIn && <NotificationBell />}
          <Button asChild className="hidden rounded-full px-4 sm:inline-flex">
            <Link to="/pets/new">
              <PlusIcon aria-hidden />
              ลงประกาศ
            </Link>
          </Button>

          <div className="hidden md:flex md:items-center md:gap-2">
            {status === 'anonymous' && (
              <>
                <Button asChild variant="ghost" className="rounded-full px-4">
                  <Link to="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-field-border/50 bg-card px-4">
                  <Link to="/register">สมัครสมาชิก</Link>
                </Button>
              </>
            )}
            {isLoggedIn && (
              <Button variant="ghost" className="rounded-full px-4" onClick={logout}>
                <LogOutIcon aria-hidden />
                ออกจากระบบ
              </Button>
            )}
          </div>

          {/* มือถือ: ยุบเป็นเมนู */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="rounded-full md:hidden" aria-label="เปิดเมนู">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            {/* มือถือ: ลิงก์ตัวใหญ่ขึ้น เป้ากดสูง ≥44px · ปุ่มแคปซูลเต็มความกว้าง */}
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>เมนู</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="เมนูหลัก">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/pets'}
                    className={(state) => cn(navLinkClass(state), 'flex min-h-11 items-center text-base')}
                    onClick={closeMenu}
                  >
                    <NavLabel text={item.label} />
                  </NavLink>
                ))}
                <Button asChild size="lg" className="mt-4 rounded-full">
                  <Link to="/pets/new" onClick={closeMenu}>
                    <PlusIcon aria-hidden />
                    ลงประกาศ
                  </Link>
                </Button>
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  {status === 'anonymous' && (
                    <>
                      <Button asChild size="lg" variant="outline" className="rounded-full border-field-border/50 bg-card">
                        <Link to="/login" onClick={closeMenu}>เข้าสู่ระบบ</Link>
                      </Button>
                      <Button asChild size="lg" variant="ghost" className="rounded-full">
                        <Link to="/register" onClick={closeMenu}>สมัครสมาชิก</Link>
                      </Button>
                    </>
                  )}
                  {isLoggedIn && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full border-field-border/50 bg-card"
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
