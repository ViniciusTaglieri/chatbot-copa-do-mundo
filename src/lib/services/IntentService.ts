import type { IntentResult, IntentType } from "../types"

const PLAYER_KEYWORDS = [
  "jogador", "jogadora", "lenda", "craque", "artilheiro", "goleador",
  "meio-campo", "atacante", "zagueiro", "goleiro", "lateral", "ponta",
  "fenômeno", "rei", "melhor do mundo", "bola de ouro",
]

const TEAM_KEYWORDS = [
  "seleção", "selecao", "time", "equipe", "elenco", "escalação", "escalacao",
  "tecnic", "técnic", "convocação", "convocacao",
]

const COUNTRY_KEYWORDS = [
  "país", "pais", "capital", "população", "populacao", "idioma", "cultura",
  "bandeira", "curiosidade do país", "curiosidade do pais",
]

const TRIVIA_KEYWORDS = [
  "curiosidade", "fato", "sabia", "sabia que", "incrível", "surpreendente",
  "aleatório", "aleatorio", "historinha",
]

const QUIZ_KEYWORDS = [
  "quiz", "pergunta", "teste", "desafio", "responda", "questão", "questao",
  "vamos brincar", "brincadeira", "adivinha",
]

function extractEntities(
  text: string,
  intentType: IntentType
): IntentResult["entities"] {
  const entities: IntentResult["entities"] = {}

  if (intentType === "player" || intentType === "team" || intentType === "country") {
    const copaMatch = text.match(/(\d{4})/)
    if (copaMatch) {
      entities.year = parseInt(copaMatch[1])
    }
  }

  return entities
}

function calculateKeywordScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      score += 1
    }
  }
  return score
}

export function classifyIntent(text: string): IntentResult {
  const lower = text.toLowerCase()

  const scores: Record<IntentType, number> = {
    player: calculateKeywordScore(lower, PLAYER_KEYWORDS),
    team: calculateKeywordScore(lower, TEAM_KEYWORDS),
    country: calculateKeywordScore(lower, COUNTRY_KEYWORDS),
    trivia: calculateKeywordScore(lower, TRIVIA_KEYWORDS),
    quiz: calculateKeywordScore(lower, QUIZ_KEYWORDS),
    general: 0,
  }

  const namePatterns = [
    ...lower.matchAll(/(?:lenda|craque|jogador|jogadora) ([\w\s]+?)(?: na copa| em \d{4}|$)/gi),
    ...lower.matchAll(/(?:seleção|selecao|time d) ([\w\s]+?)(?: na copa| em \d{4}|$)/gi),
  ]

  const entities: IntentResult["entities"] = {}
  if (namePatterns.length > 0) {
    const name = namePatterns[0][1].trim()
    if (scores.player > 0) entities.playerName = name
    if (scores.team > 0) entities.teamName = name
  }

  let bestType: IntentType = "general"
  let bestScore = 0

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestType = type as IntentType
    }
  }

  const extractedEntities = extractEntities(lower, bestType)

  return {
    type: bestType,
    confidence: Math.min(bestScore / 3, 1),
    entities: { ...entities, ...extractedEntities },
  }
}
