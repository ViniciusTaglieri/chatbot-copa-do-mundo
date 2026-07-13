import { getFromCache, setToCache } from "@/lib/cache"
import type { ImageResult } from "../types"

const WIKIMEDIA_BASE = "https://en.wikipedia.org/w/api.php"
const SERPAPI_BASE = "https://serpapi.com/search.json"
const IMAGE_CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function searchSerpAPI(query: string, limit: number): Promise<ImageResult[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) return []

  try {
    const url = `${SERPAPI_BASE}?engine=google_images&q=${encodeURIComponent(query)}&api_key=${apiKey}&safe=active&hl=pt-br`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return []

    const data = await res.json()
    const results = (data.images_results ?? [])
      .slice(0, limit)
      .map((img: { original: string; thumbnail?: string; title?: string }) => ({
        url: img.original,
        thumbnail: img.thumbnail,
        source: "serpapi" as const,
      }))

    return results
  } catch (error) {
    console.error("[ImageService] searchSerpAPI error:", error)
    return []
  }
}

async function searchWikimedia(query: string, limit: number): Promise<ImageResult[]> {
  try {
    const url = `${WIKIMEDIA_BASE}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return []

    const results: ImageResult[] = Object.values(pages as Record<string, { thumbnail?: { source?: string } }>)
      .filter((p): p is { thumbnail: { source: string } } => !!p.thumbnail?.source)
      .map((p) => ({
        url: p.thumbnail.source,
        source: "wikimedia" as const,
      }))

    return results
  } catch (error) {
    console.error("[ImageService] searchWikimedia error:", error)
    return []
  }
}

export async function searchImages(query: string, limit: number = 3): Promise<ImageResult[]> {
  const key = `images:${query.toLowerCase().trim()}:${limit}`
  const cached = getFromCache<ImageResult[]>(key)
  if (cached) return cached

  const [serpResult, wikiResult] = await Promise.allSettled([
    searchSerpAPI(query, limit),
    searchWikimedia(query, limit),
  ])

  const results =
    (serpResult.status === "fulfilled" && serpResult.value.length > 0)
      ? serpResult.value
      : (wikiResult.status === "fulfilled" ? wikiResult.value : [])

  if (results.length > 0) setToCache(key, results, IMAGE_CACHE_TTL)
  return results
}
