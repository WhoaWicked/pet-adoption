// แปลง type ของแจ้งเตือน → ข้อความภาษาไทย + หน้าที่ต้องพาไป
// ไม่ใช้ message ภาษาอังกฤษจาก API ตรง ๆ · entity_id เป็น id ของคำขอ จึงพาไปหน้ารายการแทนการเจาะจงรายการ

export interface NotificationContent {
  text: string
  /** undefined = ไม่รู้จัก type นี้ ไม่ต้องนำทาง */
  to?: string
}

const CONTENT: Record<string, NotificationContent> = {
  'application.received': { text: 'มีคนยื่นคำขอรับเลี้ยงน้องของคุณ', to: '/my-pets' },
  'application.approved': { text: 'คำขอของคุณได้รับการอนุมัติ', to: '/my-applications' },
  'application.rejected': { text: 'คำขอของคุณไม่ได้รับเลือก', to: '/my-applications' },
}

const FALLBACK: NotificationContent = { text: 'มีการแจ้งเตือนใหม่' }

export function getNotificationContent(type: string): NotificationContent {
  return Object.hasOwn(CONTENT, type) ? CONTENT[type] : FALLBACK
}
