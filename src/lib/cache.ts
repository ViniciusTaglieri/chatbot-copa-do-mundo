const cache = new Map<string, { data: unknown; expiresAt: number }>()

const DEFAULT_TTL_MS = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 1000

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setToCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function clearCache(): void {
  cache.clear()
}
