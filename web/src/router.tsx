import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetsListPage } from '@/pages/PetsListPage'
import { RegisterPage } from '@/pages/RegisterPage'

// เส้นทางทั้งหมดของแอป — หน้าที่ยังไม่ทำ (รอบถัดไป) ชี้ไป ComingSoonPage ชั่วคราว
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PetsListPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      // หน้าที่ต้อง login (react-router จับคู่แบบ ranked: pets/new ชนะ pets/:id เสมอ)
      {
        element: <RequireAuth />,
        children: [
          { path: 'pets/new', element: <ComingSoonPage /> },
          { path: 'my-applications', element: <ComingSoonPage /> },
          { path: 'saved', element: <ComingSoonPage /> },
          { path: 'my-pets', element: <ComingSoonPage /> },
          { path: 'my-pets/:petId', element: <ComingSoonPage /> },
        ],
      },
      { path: 'pets/:id', element: <ComingSoonPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
