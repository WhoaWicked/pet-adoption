import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from '@/lib/query/query-client'
import { router } from '@/router'
import './index.css'

// จุดเริ่มของแอป: TanStack Query (server state) ครอบ router — AuthProvider อยู่ใน AppLayout
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
