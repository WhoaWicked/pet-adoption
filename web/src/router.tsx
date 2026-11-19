import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { CreatePetPage } from '@/pages/CreatePetPage'
import { LoginPage } from '@/pages/LoginPage'
import { MyApplicationsPage } from '@/pages/MyApplicationsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetDetailPage } from '@/pages/PetDetailPage'
import { PetsListPage } from '@/pages/PetsListPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SavedPetsPage } from '@/pages/SavedPetsPage'

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
          { path: 'pets/new', element: <CreatePetPage /> },
          { path: 'my-applications', element: <MyApplicationsPage /> },
          { path: 'saved', element: <SavedPetsPage /> },
          { path: 'my-pets', element: <ComingSoonPage /> },
          { path: 'my-pets/:petId', element: <ComingSoonPage /> },
        ],
      },
      { path: 'pets/:id', element: <PetDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
