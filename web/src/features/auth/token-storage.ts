// เก็บ access token ใน localStorage (key เดียว)
// ครอบ try/catch เพราะ localStorage อาจใช้ไม่ได้ (private mode, ถูกบล็อก) —
// กรณีนั้นเก็บไว้ในหน่วยความจำแทน (session อยู่แค่จน refresh หน้า)

const TOKEN_KEY = 'pet-adoption.accessToken'
let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setToken(token: string): void {
  memoryToken = token
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ใช้ memoryToken แทน
  }
}

export function clearToken(): void {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}
