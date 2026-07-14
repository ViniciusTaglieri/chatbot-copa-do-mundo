import type { IntentResult, IntentType } from "@lib/types"

const KNOWN_TEAMS = [
  "brasil", "argentina", "alemanha", "frança", "espanha", "itália",
  "inglaterra", "uruguai", "portugal", "holanda", "bélgica", "croácia",
  "japão", "coreia", "méxico", "colômbia", "chile", "senegal",
]

const KNOWN_PLAYERS = [
  "ronaldo", "neymar", "messi", "mbappé", "pele", "maradona",
  "zidane", "beckham", "ronaldinho", "cafu", "roberto carlos",
]

const CLASSIFICATION_PROMPT = `Classifique a mensagem do usuário em uma das categorias abaixo. Retorne APENAS um JSON no formato:
{"type": "<categoria>", "entities": {"playerName": "<nome se mencionado>", "teamName": "<nome se mencionado>", "countryName": "<nome se mencionado>", "year": <ano se mencionado>}}

Categorias:
- "player": Pergunta sobre um jogador de futebol (nome, carreira, feitos)
- "team": Pergunta sobre uma seleção/time nacional
- "country": Pergunta sobre um país (capital, população, cultura)
- "trivia": Pedido de curiosidade, fato surpreendente
- "quiz": Pedido de quiz, pergunta, desafio
- "general": Qualquer outra coisa (saudação, agradecimento, etc)

Regras:
- Se o usuário menciona um nome próprio associado a futebol → "player"
- Se o usuário menciona "seleção", "time", ou nome de país como time → "team"
- Se o usuário pergunta sobre país como entidade geopolítica → "country"
- Se o usuário pede curiosidade ou fato → "trivia"
- Se o usuário quer jogar quiz ou responder pergunta → "quiz"
- Seja preciso: "Brasil" pode ser team ou country dependendo do contexto
- Retorne APENAS o JSON, sem texto adicional`

function extractEntities(
  text: string,
  intentType: IntentType
): IntentResult["entities"] {
  const entities: IntentResult["entities"] = {}
  const lower = text.toLowerCase()

  const yearMatch = text.match(/(\d{4})/)
  if (yearMatch) entities.year = parseInt(yearMatch[1])

  if (intentType === "player") {
    for (const p of KNOWN_PLAYERS) {
      if (lower.includes(p)) { entities.playerName = p; break }
    }
  }

  if (intentType === "team") {
    for (const t of KNOWN_TEAMS) {
      if (lower.includes(t)) { entities.teamName = t; break }
    }
  }

  if (intentType === "country") {
    for (const t of KNOWN_TEAMS) {
      if (lower.includes(t)) { entities.countryName = t; break }
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

function classifyByKeywords(text: string): IntentResult {
  const lower = text.toLowerCase()

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

  const scores: Record<IntentType, number> = {
    player: calculateKeywordScore(lower, PLAYER_KEYWORDS),
    team: calculateKeywordScore(lower, TEAM_KEYWORDS),
    country: calculateKeywordScore(lower, COUNTRY_KEYWORDS),
    trivia: calculateKeywordScore(lower, TRIVIA_KEYWORDS),
    quiz: calculateKeywordScore(lower, QUIZ_KEYWORDS),
    general: 0,
  }

  let bestType: IntentType = "general"
  let bestScore = 0

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestType = type as IntentType
    }
  }

  const entities = extractEntities(lower, bestType)

  return {
    type: bestType,
    confidence: Math.min(bestScore / 3, 1),
    entities,
  }
}

export async function classifyIntent(text: string): Promise<IntentResult> {
  try {
    const { generateText } = await import("ai")
    const { groq } = await import("@ai-sdk/groq")

    const { text: raw } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      instructions: CLASSIFICATION_PROMPT,
      prompt: `Mensagem: "${text}"`,
      temperature: 0.1,
      maxOutputTokens: 200,
    })

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(cleaned)

    const intentType: IntentType = ["player", "team", "country", "trivia", "quiz", "general"]
      .includes(parsed.type) ? parsed.type : "general"

    const entities = extractEntities(text.toLowerCase(), intentType)

    return {
      type: intentType,
      confidence: 0.95,
      entities: {
        playerName: parsed.entities?.playerName,
        teamName: parsed.entities?.teamName,
        countryName: parsed.entities?.countryName,
        year: parsed.entities?.year,
        ...entities,
      },
    }
  } catch (error) {
    console.error("[IntentService] classifyIntent error:", error)
    return classifyByKeywords(text)
  }
}
