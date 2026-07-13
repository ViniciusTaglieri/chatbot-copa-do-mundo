import { describe, it, expect } from "vitest"
import { buildCardDataParts } from "@/lib/card-stream"
import type { ContextPayload } from "@/lib/types"

describe("buildCardDataParts", () => {
  it("should return empty array for empty context", () => {
    const context: ContextPayload = {
      intent: { type: "general", confidence: 1, entities: {} },
    }
    expect(buildCardDataParts(context)).toEqual([])
  })

  it("should build playerCard part", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player: {
        id: "1",
        name: "Ronaldo",
        countryCode: "BR",
        nationalTeamName: "Brasil",
        position: "Atacante",
        cupsPlayed: [1994, 1998, 2002],
        totalGoalsInWorldCups: 15,
      },
      images: ["https://example.com/ronaldo.jpg"],
    }
    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-playerCard")
    expect(parts[0].data).toEqual({
      player: context.player,
      images: context.images ?? [],
    })
  })

  it("should build teamCard part", () => {
    const context: ContextPayload = {
      intent: { type: "team", confidence: 1, entities: {} },
      team: {
        id: "1",
        name: "Brasil",
        countryCode: "BR",
        cupsParticipated: [1930, 1950],
        bestResult: "Campeão",
      },
      images: ["https://example.com/brasil.png"],
    }
    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-teamCard")
  })

  it("should build countryCard part", () => {
    const context: ContextPayload = {
      intent: { type: "country", confidence: 1, entities: {} },
      country: {
        code: "BR",
        name: "Brasil",
        capital: "Brasília",
        region: "América do Sul",
      },
    }
    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-countryCard")
  })

  it("should build triviaCard part", () => {
    const context: ContextPayload = {
      intent: { type: "trivia", confidence: 1, entities: {} },
      trivia: {
        id: "t1",
        type: "general",
        title: "Curiosidade",
        description: "A primeira Copa foi em 1930.",
      },
    }
    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe("data-triviaCard")
  })

  it("should build multiple card parts", () => {
    const context: ContextPayload = {
      intent: { type: "player", confidence: 1, entities: {} },
      player: {
        id: "1",
        name: "Ronaldo",
        countryCode: "BR",
        nationalTeamName: "Brasil",
        position: "Atacante",
      },
      country: { code: "BR", name: "Brasil" },
      trivia: {
        id: "t1",
        type: "general",
        title: "Curiosidade",
        description: "Text",
      },
    }
    const parts = buildCardDataParts(context)
    expect(parts).toHaveLength(3)
    expect(parts.map((p) => p.type)).toEqual([
      "data-playerCard",
      "data-countryCard",
      "data-triviaCard",
    ])
  })
})


