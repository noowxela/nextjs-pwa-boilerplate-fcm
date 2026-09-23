import { promises as fs } from 'node:fs'
import path from 'node:path'

export type StoredFcmToken = {
  token: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'fcm-tokens.json')

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(STORE_PATH)
  } catch {
    await fs.writeFile(STORE_PATH, '[]\n', 'utf8')
  }
}

async function readTokens(): Promise<StoredFcmToken[]> {
  await ensureStore()
  const raw = await fs.readFile(STORE_PATH, 'utf8')
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is StoredFcmToken =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as StoredFcmToken).token === 'string'
    )
  } catch {
    return []
  }
}

async function writeTokens(tokens: StoredFcmToken[]): Promise<void> {
  await ensureStore()
  await fs.writeFile(STORE_PATH, `${JSON.stringify(tokens, null, 2)}\n`, 'utf8')
}

export async function getAllTokens(): Promise<StoredFcmToken[]> {
  return readTokens()
}

export async function saveToken(token: string): Promise<void> {
  if (!token) throw new Error('saveToken requires a non-empty FCM token')
  const tokens = await readTokens()
  const updatedAt = new Date().toISOString()
  const next = tokens.filter((t) => t.token !== token)
  next.push({ token, updatedAt })
  await writeTokens(next)
}

export async function removeToken(token: string): Promise<void> {
  if (!token) throw new Error('removeToken requires a non-empty FCM token')
  const tokens = await readTokens()
  await writeTokens(tokens.filter((t) => t.token !== token))
}
