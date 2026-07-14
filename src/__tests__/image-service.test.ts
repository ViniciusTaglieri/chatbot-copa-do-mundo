import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { searchImages } from "@lib/services/ImageService"

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    SERPAPI_KEY: undefined as string | undefined,
  },
}))

vi.mock("@lib/env", () => ({
  get env() {
    return mockEnv
  },
}))

describe("searchImages", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    mockEnv.SERPAPI_KEY = undefined
  })

  it("should return images from SerpAPI when available", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockSerpResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg", title: "Ronaldo" },
        { original: "https://example.com/img2.jpg", thumbnail: "https://example.com/thumb2.jpg", title: "Ronaldo Fenomeno" },
        { original: "https://example.com/img3.jpg", thumbnail: "https://example.com/thumb3.jpg", title: "Ronaldo Brazil" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSerpResponse),
    }))

    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results).toHaveLength(3)
    expect(results[0].url).toBe("https://example.com/img1.jpg")
    expect(results[0].thumbnail).toBe("https://example.com/thumb1.jpg")
    expect(results[0].source).toBe("serpapi")
  })

  it("should fallback to Wikimedia when SerpAPI fails", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockWikimediaResponse = {
      query: {
        pages: {
          "123": {
            title: "Ronaldo",
            thumbnail: { source: "https://upload.wikimedia.org/thumb1.jpg" },
          },
          "456": {
            title: "Ronaldo Fenomeno",
            thumbnail: { source: "https://upload.wikimedia.org/thumb2.jpg" },
          },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWikimediaResponse),
      })
    )

    const results = await searchImages("Ronaldo Fenomeno fallback test", 3)

    expect(results).toHaveLength(2)
    expect(results[0].source).toBe("wikimedia")
    expect(results[0].url).toBe("https://upload.wikimedia.org/thumb1.jpg")
  })

  it("should return empty array when both providers fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    const results = await searchImages("nonexistent", 3)

    expect(results).toEqual([])
  })

  it("should cache results and return cached on second call", async () => {
    const mockResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg" },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const first = await searchImages("test query", 3)
    const second = await searchImages("test query", 3)

    expect(fetchMock).toHaveBeenCalledTimes(2) // SerpAPI + Wikimedia in parallel
    expect(first).toEqual(second)
  })

  it("should skip SerpAPI when SERPAPI_KEY is not set", async () => {
    mockEnv.SERPAPI_KEY = undefined

    const mockWikimediaResponse = {
      query: {
        pages: {
          "123": { thumbnail: { source: "https://upload.wikimedia.org/thumb.jpg" } },
        },
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWikimediaResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const results = await searchImages("Ronaldo", 3)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(results[0].source).toBe("wikimedia")
  })

  it("should limit results to specified limit", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockSerpResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg" },
        { original: "https://example.com/img2.jpg", thumbnail: "https://example.com/thumb2.jpg" },
        { original: "https://example.com/img3.jpg", thumbnail: "https://example.com/thumb3.jpg" },
        { original: "https://example.com/img4.jpg", thumbnail: "https://example.com/thumb4.jpg" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSerpResponse),
    }))

    const results = await searchImages("test", 2)

    expect(results).toHaveLength(2)
  })
})
