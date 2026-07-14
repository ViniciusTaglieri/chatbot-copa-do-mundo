import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { clearCache } from "@lib/cache"

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

beforeEach(() => {
  clearCache()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  mockEnv.SERPAPI_KEY = undefined
})

describe("Image API - SerpAPI", () => {
  it("should return image URLs from SerpAPI response", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockResponse = {
      images_results: [
        { original: "https://example.com/ronaldo1.jpg", thumbnail: "https://example.com/ronaldo1_thumb.jpg", title: "Ronaldo Fenomeno" },
        { original: "https://example.com/ronaldo2.jpg", thumbnail: "https://example.com/ronaldo2_thumb.jpg", title: "Ronaldo Brasil" },
        { original: "https://example.com/ronaldo3.jpg", thumbnail: "https://example.com/ronaldo3_thumb.jpg", title: "Ronaldo Nazario" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results).toHaveLength(3)
    expect(results[0]).toEqual({
      url: "https://example.com/ronaldo1.jpg",
      thumbnail: "https://example.com/ronaldo1_thumb.jpg",
      source: "serpapi",
    })
    expect(results[1].url).toBe("https://example.com/ronaldo2.jpg")
    expect(results[2].url).toBe("https://example.com/ronaldo3.jpg")
  })

  it("should call SerpAPI with correct query parameters", async () => {
    mockEnv.SERPAPI_KEY = "my-api-key"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ images_results: [] }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@lib/services/ImageService")
    await searchImages("Ronaldo Brasil football", 3)

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain("serpapi.com")
    expect(calledUrl).toContain("engine=google_images")
    expect(calledUrl).toContain("api_key=my-api-key")
    expect(calledUrl).toContain("q=Ronaldo%20Brasil%20football")
  })

  it("should skip SerpAPI when SERPAPI_KEY is missing but still call Wikimedia", async () => {
    mockEnv.SERPAPI_KEY = undefined
    const wikiResponse = {
      query: {
        pages: {
          "1": { thumbnail: { source: "https://upload.wikimedia.org/wiki.jpg" } },
        },
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(wikiResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo", 3)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(1)
    expect(results[0].source).toBe("wikimedia")
  })
})

describe("Image API - Wikimedia", () => {
  it("should return image URLs from Wikimedia response", async () => {
    const mockResponse = {
      query: {
        pages: {
          "1": { title: "Ronaldo", thumbnail: { source: "https://upload.wikimedia.org/thumb1.jpg" } },
          "2": { title: "Ronaldo Nazario", thumbnail: { source: "https://upload.wikimedia.org/thumb2.jpg" } },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo Nazario", 3)

    expect(results).toHaveLength(2)
    expect(results[0].source).toBe("wikimedia")
    expect(results[0].url).toBe("https://upload.wikimedia.org/thumb1.jpg")
  })

  it("should call Wikimedia with correct query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ query: { pages: {} } }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@lib/services/ImageService")
    await searchImages("Ronaldo Brasil football", 3)

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain("en.wikipedia.org/w/api.php")
    expect(calledUrl).toContain("action=query")
    expect(calledUrl).toContain("gsrsearch=Ronaldo%20Brasil%20football")
    expect(calledUrl).toContain("prop=pageimages")
  })

  it("should filter out pages without thumbnails", async () => {
    const mockResponse = {
      query: {
        pages: {
          "1": { title: "Ronaldo", thumbnail: { source: "https://upload.wikimedia.org/thumb1.jpg" } },
          "2": { title: "No Image" },
          "3": { title: "Another", thumbnail: { source: "https://upload.wikimedia.org/thumb3.jpg" } },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo", 5)

    expect(results).toHaveLength(2)
  })
})

describe("Image API - Fallback behavior", () => {
  it("should fallback to Wikimedia when SerpAPI fails", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const wikiResponse = {
      query: {
        pages: {
          "1": { thumbnail: { source: "https://upload.wikimedia.org/wiki.jpg" } },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(wikiResponse) })
    )

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo fallback", 3)

    expect(results).toHaveLength(1)
    expect(results[0].source).toBe("wikimedia")
  })

  it("should prefer SerpAPI results over Wikimedia", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const serpResponse = {
      images_results: [
        { original: "https://serpapi.com/img1.jpg", thumbnail: "https://serpapi.com/thumb1.jpg" },
      ],
    }
    const wikiResponse = {
      query: {
        pages: {
          "1": { thumbnail: { source: "https://upload.wikimedia.org/wiki.jpg" } },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serpResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(wikiResponse) })
    )

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo prefer", 3)

    expect(results).toHaveLength(1)
    expect(results[0].source).toBe("serpapi")
    expect(results[0].url).toBe("https://serpapi.com/img1.jpg")
  })

  it("should return empty when both APIs fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("nonexistent", 3)

    expect(results).toEqual([])
  })
})

describe("Image Caching", () => {
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

    const { searchImages } = await import("@lib/services/ImageService")
    const first = await searchImages("cached query", 3)
    const second = await searchImages("cached query", 3)

    expect(first).toEqual(second)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("should use separate cache keys for different queries", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg" },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@lib/services/ImageService")
    await searchImages("query1", 3)
    await searchImages("query2", 3)

    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})

describe("Image URL formats from real APIs", () => {
  it("should handle Wikimedia thumb URLs correctly", async () => {
    const mockResponse = {
      query: {
        pages: {
          "12345": {
            title: "Ronaldo (Brazilian footballer)",
            thumbnail: {
              source: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Ronaldo_2015.jpg/220px-Ronaldo_2015.jpg",
              width: 220,
              height: 330,
            },
          },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo Nazario", 1)

    expect(results).toHaveLength(1)
    expect(results[0].url).toContain("upload.wikimedia.org")
    expect(results[0].url).toContain("thumb")
  })

  it("should handle SerpAPI with various image domains", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockResponse = {
      images_results: [
        { original: "https://p16-sign-sg.tiktokcdn.com/img1.jpg", thumbnail: "https://p16-sign-sg.tiktokcdn.com/thumb1.jpg" },
        { original: "https://pbs.twimg.com/img2.jpg", thumbnail: "https://pbs.twimg.com/thumb2.jpg" },
        { original: "https://images.unsplash.com/img3.jpg", thumbnail: "https://images.unsplash.com/thumb3.jpg" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results).toHaveLength(3)
    expect(results[0].source).toBe("serpapi")
    expect(results[1].source).toBe("serpapi")
    expect(results[2].source).toBe("serpapi")
  })
})

describe("Image limit behavior", () => {
  it("should respect the limit parameter", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockResponse = {
      images_results: Array.from({ length: 10 }, (_, i) => ({
        original: `https://example.com/img${i}.jpg`,
        thumbnail: `https://example.com/thumb${i}.jpg`,
      })),
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo", 2)

    expect(results).toHaveLength(2)
  })

  it("should return fewer results when API returns less than limit", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const mockResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { searchImages } = await import("@lib/services/ImageService")
    const results = await searchImages("Ronaldo", 5)

    expect(results).toHaveLength(1)
  })
})
