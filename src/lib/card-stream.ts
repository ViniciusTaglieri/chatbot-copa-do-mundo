import type { ChatCardDataParts, ContextPayload } from "./types"

type CardDataPartEntry = {
  [K in keyof ChatCardDataParts]: {
    type: `data-${K}`
    data: ChatCardDataParts[K]
  }
}[keyof ChatCardDataParts]

export function buildCardDataParts(context: ContextPayload): CardDataPartEntry[] {
  const parts: CardDataPartEntry[] = []

  if (context.player) {
    parts.push({
      type: "data-playerCard",
      data: { player: context.player, images: context.images ?? [] },
    })
  }

  if (context.team) {
    parts.push({
      type: "data-teamCard",
      data: { team: context.team, images: context.images ?? [] },
    })
  }

  if (context.country) {
    parts.push({
      type: "data-countryCard",
      data: { country: context.country },
    })
  }

  if (context.trivia) {
    parts.push({
      type: "data-triviaCard",
      data: context.trivia,
    })
  }

  return parts
}


