import { describe, it, expect } from "vitest"
import { buildCardDataParts } from "@/lib/card-stream"
import type { ContextPayload, Player, NationalTeam, Country, TriviaItem } from "@/lib/types"

const mockPlayer: Player = {
  id: "1",
  name: "Ronaldo",
  countryCode: "BR",
  nationalTeamName: "Brasil",
  position: "Atacante",
  cupsPlayed: [1994, 1998, 2002],
  totalGoalsInWorldCups: 15,
  totalMatchesInWorldCups: 19,
}

const mockImages = [
  "https://upload.wikimedia.org/thumb1.jpg",
  "https://example.com/ronaldo2.jpg",
  "https://serpapi.com/ronaldo3.jpg",
]

const mockTeam: NationalTeam = {
  id: "2",
  name: "Brasil",
  countryCode: "BR",
  cupsParticipated: [1930, 1950, 1958, 1962, 1970, 1994, 2002],
  bestResult: "Campeão",
}

const mockCountry: Country = {
  code: "BR",
  name: "Brasil",
  capital: "Brasília",
  region: "América do Sul",
  population: 214000000,
}

const mockTrivia: TriviaItem = {
  id: "t1",
  type: "general",
  title: "Curiosidade",
  description: "A primeira Copa foi em 1930.",
}

describe("Card stream - Images in playerCard", () => {
  it("should include images in playerCard when context has images", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: { playerName: "ronaldo" } },
      player: mockPlayer,
      images: mockImages,
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-playerCard")
    expect((parts[0].data as { images: string[] }).images).toEqual(mockImages)
  })

  it("should include empty images array when context has no images", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: { playerName: "ronaldo" } },
      player: mockPlayer,
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    expect((parts[0].data as { images: string[] }).images).toEqual([])
  })

  it("should include images in teamCard when context has images", () => {
    const context: ContextPayload = {
      intent: { type: "team", confidence: 1, entities: { teamName: "brasil" } },
      team: mockTeam,
      images: ["https://example.com/brasil1.jpg", "https://example.com/brasil2.jpg"],
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-teamCard")
    expect((parts[0].data as { images: string[] }).images).toEqual([
      "https://example.com/brasil1.jpg",
      "https://example.com/brasil2.jpg",
    ])
  })

  it("should not include images in countryCard", () => {
    const context: ContextPayload = {
      intent: { type: "country", confidence: 1, entities: { countryName: "brasil" } },
      country: mockCountry,
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-countryCard")
    expect(parts[0].data).toEqual({ country: mockCountry, images: [] })
  })
})

describe("Card stream - Full context building", () => {
  it("should build all card types for player intent with full context", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: { playerName: "ronaldo" } },
      player: mockPlayer,
      images: mockImages,
      country: mockCountry,
      trivia: mockTrivia,
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(3)
    expect(parts.map(p => p.type)).toEqual([
      "data-playerCard",
      "data-countryCard",
      "data-triviaCard",
    ])
  })

  it("should handle team context with images and country", () => {
    const context: ContextPayload = {
      intent: { type: "team", confidence: 1, entities: { teamName: "brasil" } },
      team: mockTeam,
      images: ["https://example.com/team.jpg"],
      country: mockCountry,
    }

    const parts = buildCardDataParts(context)

    expect(parts).toHaveLength(2)
    expect(parts.map(p => p.type)).toEqual([
      "data-teamCard",
      "data-countryCard",
    ])
  })
})

describe("Card stream - PlayerCard data structure", () => {
  it("should have correct PlayerCardData structure", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player: mockPlayer,
      images: mockImages,
    }

    const parts = buildCardDataParts(context)
    const playerCardPart = parts[0]

    expect(playerCardPart.type).toBe("data-playerCard")

    const data = playerCardPart.data as { player: Player; images: string[] }
    expect(data.player).toEqual(mockPlayer)
    expect(data.images).toEqual(mockImages)
    expect(data.player.name).toBe("Ronaldo")
    expect(data.player.position).toBe("Atacante")
    expect(data.player.nationalTeamName).toBe("Brasil")
    expect(data.player.cupsPlayed).toEqual([1994, 1998, 2002])
    expect(data.player.totalGoalsInWorldCups).toBe(15)
  })
})

describe("Card stream - Edge cases", () => {
  it("should handle player with no cupsPlayed", () => {
    const player: Player = {
      id: "3",
      name: "Test Player",
      countryCode: "BR",
      nationalTeamName: "Brasil",
      position: "Atacante",
    }

    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player,
      images: ["https://example.com/img.jpg"],
    }

    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(1)

    const data = parts[0].data as { player: Player }
    expect(data.player.cupsPlayed).toBeUndefined()
    expect(data.player.totalGoalsInWorldCups).toBeUndefined()
  })

  it("should handle images array with single image", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player: mockPlayer,
      images: ["https://only-one-image.com/img.jpg"],
    }

    const parts = buildCardDataParts(context)
    const data = parts[0].data as { images: string[] }
    expect(data.images).toHaveLength(1)
  })

  it("should handle images array with many images", () => {
    const manyImages = Array.from({ length: 10 }, (_, i) => `https://example.com/img${i}.jpg`)
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player: mockPlayer,
      images: manyImages,
    }

    const parts = buildCardDataParts(context)
    const data = parts[0].data as { images: string[] }
    expect(data.images).toHaveLength(10)
  })
})
