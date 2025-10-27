import * as kv from './kv_store'

export type AuditEvent = {
  type: string
  route: string
  userId?: string
  userName?: string
  payload?: any
}

export async function logEvent(event: AuditEvent) {
  const id = `log:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const entry = {
    id,
    ...event,
    timestamp: new Date().toISOString(),
  }
  try {
    await kv.set(id, entry)
  } catch (e) {
    console.error('Failed to log event:', e)
  }
}