import { describe, it, expect } from "vitest"
import { extractCardsFromResponse } from "@/lib/stream-parser"

describe("extractCardsFromResponse", () => {
  it("should return text as-is when no cards present", () => {
    const text = "Olá, como vai?"
    const result = extractCardsFromResponse(text)
    expect(result.text).toBe(text)
    expect(result.cardData).toBeUndefined()
  })

  it("should extract player card", () => {
    const text = 'Ronaldo é lenda! ---CARDS:{"playerCard":{"player":{"id":"1","name":"Ronaldo","countryCode":"BR","nationalTeamName":"Brasil","position":"Atacante","cupsPlayed":[1994,1998,2002]},"imageUrl":"https://example.com/ronaldo.jpg"}}---'
    const result = extractCardsFromResponse(text)
    expect(result.text).toBe('Ronaldo é lenda!')
    expect(result.cardData?.playerCard).toBeDefined()
    expect(result.cardData?.playerCard?.player.name).toBe("Ronaldo")
  })

  it("should extract multiple cards", () => {
    const text = 'Brasil é lindo! ---CARDS:{"teamCard":{"team":{"id":"1","name":"Brasil","countryCode":"BR","cupsParticipated":[1930,1950]},"imageUrl":"https://example.com/brasil.jpg"},"countryCard":{"country":{"code":"br","name":"Brasil","capital":"Brasília"}}}---'
    const result = extractCardsFromResponse(text)
    expect(result.cardData?.teamCard).toBeDefined()
    expect(result.cardData?.countryCard).toBeDefined()
  })

  it("should handle malformed JSON gracefully", () => {
    const text = 'Texto ---CARDS:{invalid json}---'
    const result = extractCardsFromResponse(text)
    expect(result.text).toBe(text)
    expect(result.cardData).toBeUndefined()
  })
})
