import { clearCache } from "@lib/cache"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    ZAFRONIX_API_BASE_URL: "https://api.test.com",
    ZAFRONIX_API_KEY: "test-key",
    GROQ_API_KEY: "test-key",
    RAPIDAPI_KEY: undefined as string | undefined,
    RAPIDAPI_HOST: undefined as string | undefined,
    SERPAPI_KEY: undefined as string | undefined,
  },
}))

vi.mock("@lib/env", () => ({
  get env() {
    return mockEnv
  },
}))

describe("WorldCupDataService", () => {
  beforeEach(() => {
    clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearCache()
  })

  describe("searchPlayer", () => {
    it("should return player data when API responds", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{
          id: 1,
          name: "Ronaldo",
          country_code: "BR",
          national_team: "Brasil",
          position: "Atacante",
          world_cups: [1994, 1998, 2002],
          total_goals: 15,
          total_matches: 19,
        }]),
      }))

      const { searchPlayer } = await import("@lib/services/WorldCupDataService")
      const player = await searchPlayer("Ronaldo")

      expect(player).not.toBeNull()
      expect(player?.name).toBe("Ronaldo")
      expect(player?.position).toBe("Atacante")
    })

    it("should return null when API returns empty", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }))

      const { searchPlayer } = await import("@lib/services/WorldCupDataService")
      const player = await searchPlayer("NonExistent")

      expect(player).toBeNull()
    })

    it("should return null when API fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

      const { searchPlayer } = await import("@lib/services/WorldCupDataService")
      const player = await searchPlayer("Ronaldo")

      expect(player).toBeNull()
    })
  })

  describe("getTeamByName", () => {
    it("should return team data when API responds", async () => {
      vi.stubGlobal("fetch", vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [{ href: "/teams/brasil", label: "Brasil" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            name: "Brasil",
            flag: { fifaCode: "BRA" },
            appearances: [
              { year: 1958, finalPosition: 1 },
              { year: 1962, finalPosition: 1 },
              { year: 1970, finalPosition: 1 },
              { year: 1994, finalPosition: 1 },
              { year: 2002, finalPosition: 1 },
            ],
          }),
        })
      )

      const { getTeamByName } = await import("@lib/services/WorldCupDataService")
      const team = await getTeamByName("Brasil")

      expect(team).not.toBeNull()
      expect(team?.name).toBe("Brasil")
      expect(team?.bestResult).toBe("Campeão")
    })

    it("should return null when API fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

      const { getTeamByName } = await import("@lib/services/WorldCupDataService")
      const team = await getTeamByName("Brasil")

      expect(team).toBeNull()
    })
  })

  describe("getRandomTrivia", () => {
    it("should return trivia when API responds", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{
          title: "Curiosidade",
          description: "A primeira Copa foi em 1930.",
        }]),
      }))

      const { getRandomTrivia } = await import("@lib/services/WorldCupDataService")
      const trivia = await getRandomTrivia()

      expect(trivia).not.toBeNull()
      expect(trivia?.description).toContain("1930")
    })

    it("should return null when API fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

      const { getRandomTrivia } = await import("@lib/services/WorldCupDataService")
      const trivia = await getRandomTrivia()

      expect(trivia).toBeNull()
    })
  })
})
