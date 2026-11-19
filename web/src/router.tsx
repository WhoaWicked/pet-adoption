import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { CreatePetPage } from '@/pages/CreatePetPage'
import { LoginPage } from '@/pages/LoginPage'
import { ManagePetPage } from '@/pages/ManagePetPage'
import { MyApplicationsPage } from '@/pages/MyApplicationsPage'
import { MyPetsPage } from '@/pages/MyPetsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetDetailPage } from '@/pages/PetDetailPage'
import { PetsListPage } from '@/pages/PetsListPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SavedPetsPage } from '@/pages/SavedPetsPage'

// เส้นทางทั้งหมดของแอป
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
          { path: 'my-pets', element: <MyPetsPage /> },
          { path: 'my-pets/:petId', element: <ManagePetPage /> },
        ],
      },
      { path: 'pets/:id', element: <PetDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
