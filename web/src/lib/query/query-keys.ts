import type { PetListFilter } from '@/lib/api/endpoints'

// query key ของ TanStack Query รวมไว้ที่เดียว — invalidate เป็นกลุ่มได้ง่าย เช่น queryKeys.pets.all
// (บาง key เตรียมไว้ให้หน้ารอบถัดไป)

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  pets: {
    all: ['pets'] as const,
    /** ทุกหน้าของรายการ (ทุก filter) — ใช้ invalidate ทีเดียวหลังลงประกาศ */
    lists: ['pets', 'list'] as const,
    list: (filter: PetListFilter) => ['pets', 'list', filter] as const,
    detail: (id: string) => ['pets', 'detail', id] as const,
    saved: ['pets', 'saved'] as const,
    mine: ['pets', 'mine'] as const,
  },
  applications: {
    all: ['applications'] as const,
    mine: (page: number) => ['applications', 'mine', page] as const,
    byPet: (petId: string) => ['applications', 'pet', petId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
}
