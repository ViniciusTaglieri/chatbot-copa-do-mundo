import type { ChatResponse } from "./types"

export function extractCardsFromResponse(content: string): {
  text: string
  cardData?: ChatResponse
} {
  const cardMatch = content.match(/---CARDS:(\{.+?\})---/)
  if (!cardMatch) {
    return { text: content }
  }

  try {
    const cardData = JSON.parse(cardMatch[1]) as ChatResponse
    const text = content.replace(cardMatch[0], "").trim()
    return { text, cardData }
  } catch {
    return { text: content }
  }
}
