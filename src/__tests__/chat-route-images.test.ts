import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    SERPAPI_KEY: undefined as string | undefined,
    GROQ_API_KEY: undefined as string | undefined,
  },
}))

vi.mock("@/lib/env", () => ({
  get env() {
    return mockEnv
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  mockEnv.SERPAPI_KEY = undefined
  mockEnv.GROQ_API_KEY = undefined
})

describe("Intent classification for Ronaldo Fenômeno", () => {
  it("should classify player intent via keyword fallback", async () => {
    vi.mock("@ai-sdk/groq", () => ({
      groq: vi.fn(() => "mocked-model"),
    }))

    vi.mock("ai", () => ({
      generateText: vi.fn().mockRejectedValue(new Error("API error")),
    }))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Me conta da lenda Ronaldo Fenômeno")

    expect(result.type).toBe("player")
    expect(result.entities.playerName).toBe("ronaldo")
  })

  it("should detect both 'lenda' and 'fenômeno' as player keywords", async () => {
    vi.mock("@ai-sdk/groq", () => ({
      groq: vi.fn(() => "mocked-model"),
    }))

    vi.mock("ai", () => ({
      generateText: vi.fn().mockRejectedValue(new Error("API error")),
    }))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Me conta da lenda Ronaldo Fenômeno")

    expect(result.type).toBe("player")
    expect(result.confidence).toBeGreaterThan(0)
  })

  it("should extract playerName 'ronaldo' from KNOWN_PLAYERS", async () => {
    vi.mock("@ai-sdk/groq", () => ({
      groq: vi.fn(() => "mocked-model"),
    }))

    vi.mock("ai", () => ({
      generateText: vi.fn().mockRejectedValue(new Error("API error")),
    }))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Me conta da lenda Ronaldo Fenômeno")

    expect(result.entities.playerName).toBe("ronaldo")
  })
})

describe("Card building with images", () => {
  it("should include images in playerCard part", async () => {
    const { buildCardDataParts } = await import("@/lib/card-stream")

    const context = {
      intent: { type: "player" as const, confidence: 1, entities: { playerName: "ronaldo" } },
      player: {
        id: "1",
        name: "Ronaldo",
        countryCode: "BR",
        nationalTeamName: "Brasil",
        position: "Atacante",
        cupsPlayed: [1994, 1998, 2002],
        totalGoalsInWorldCups: 15,
      },
      images: [
        "https://upload.wikimedia.org/thumb1.jpg",
        "https://example.com/ronaldo2.jpg",
        "https://serpapi.com/ronaldo3.jpg",
      ],
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-playerCard")

    const data = parts[0].data as { player: { name: string }; images: string[] }
    expect(data.images).toEqual([
      "https://upload.wikimedia.org/thumb1.jpg",
      "https://example.com/ronaldo2.jpg",
      "https://serpapi.com/ronaldo3.jpg",
    ])
    expect(data.player.name).toBe("Ronaldo")
  })

  it("should return empty images array when context has no images", async () => {
    const { buildCardDataParts } = await import("@/lib/card-stream")

    const context = {
      intent: { type: "player" as const, confidence: 1, entities: {} },
      player: {
        id: "1",
        name: "Ronaldo",
        countryCode: "BR",
        nationalTeamName: "Brasil",
        position: "Atacante",
      },
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    const data = parts[0].data as { images: string[] }
    expect(data.images).toEqual([])
  })
})

describe("ImageService API calls", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("should call SerpAPI with correct URL when key is set", async () => {
    mockEnv.SERPAPI_KEY = "test-api-key"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ images_results: [] }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@/lib/services/ImageService")
    await searchImages("Ronaldo Fenomeno", 3)

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain("serpapi.com")
    expect(calledUrl).toContain("api_key=test-api-key")
    expect(calledUrl).toContain("q=Ronaldo%20Fenomeno")
  })

  it("should call Wikimedia API", async () => {
    mockEnv.SERPAPI_KEY = undefined
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ query: { pages: {} } }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { searchImages } = await import("@/lib/services/ImageService")
    await searchImages("Ronaldo Nazario", 3)

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain("en.wikipedia.org")
    expect(calledUrl).toContain("prop=pageimages")
  })

  it("should return images when APIs succeed", async () => {
    mockEnv.SERPAPI_KEY = "test-key"
    const serpResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(serpResponse),
    }))

    const { searchImages } = await import("@/lib/services/ImageService")
    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].url).toBe("https://example.com/img1.jpg")
  })
})
