import { createClient } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { HabitService } from './gen/backend_connect'

// In dev, Vite proxies /habits.HabitService/* → http://localhost:4001
// so we use a relative base URL so the proxy is hit automatically.
const transport = createGrpcWebTransport({
  baseUrl: window.location.origin,
})

const client = createClient(HabitService, transport)

export interface BackendHabit {
  id: number
  name: string
}

export interface BackendCompletion {
  id: number
  habitName: string
  timestamp: bigint
}

export async function createHabit(name: string): Promise<BackendHabit> {
  const res = await client.createHabit({ name })
  return { id: res.id, name: res.name }
}

export async function getAllHabits(): Promise<BackendHabit[]> {
  const res = await client.getAllHabits({})
  return res.habits.map((h) => ({ id: h.id, name: h.name }))
}

export async function logHabitCompletion(
  habitName: string,
  dateStr: string,
): Promise<void> {
  // Convert YYYY-MM-DD to Unix timestamp (seconds) for midnight UTC of that day
  const [y, m, d] = dateStr.split('-').map(Number)
  const ts = BigInt(Math.floor(Date.UTC(y, m - 1, d) / 1000))
  await client.logHabitCompletion({ habitName, timestamp: ts })
}

export async function getHabitHistory(habitName: string): Promise<Set<string>> {
  const res = await client.getHabitHistory({ habitName })
  const doneDates = new Set<string>()
  for (const c of res.completions) {
    const ts = Number(c.timestamp) * 1000
    const date = new Date(ts)
    const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    doneDates.add(dateStr)
  }
  return doneDates
}
