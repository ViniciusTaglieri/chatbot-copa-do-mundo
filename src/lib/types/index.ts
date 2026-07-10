export interface Player {
  id: string
  name: string
  countryCode: string
  nationalTeamName: string
  position: string
  cupsPlayed: number[]
  totalGoalsInWorldCups?: number
  totalMatchesInWorldCups?: number
}

export interface NationalTeam {
  id: string
  name: string
  countryCode: string
  cupsParticipated: number[]
  bestResult?: string
}

export interface Country {
  code: string
  name: string
  capital?: string
  region?: string
  population?: number
  languages?: string[]
  flagUrl?: string
}

export interface TriviaItem {
  id: string
  type: "player" | "team" | "country" | "match" | "general"
  title: string
  description: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

export type IntentType = "player" | "team" | "country" | "trivia" | "quiz" | "general"

export interface IntentResult {
  type: IntentType
  confidence: number
  entities: {
    playerName?: string
    teamName?: string
    countryName?: string
    year?: number
  }
}

export interface PlayerCardData {
  player: Player
  imageUrl?: string
}

export interface TeamCardData {
  team: NationalTeam
  imageUrl?: string
}

export interface CountryCardData {
  country: Country
}

export interface ChatResponse {
  message: string
  playerCard?: PlayerCardData
  teamCard?: TeamCardData
  countryCard?: CountryCardData
  triviaCard?: TriviaItem
}

export interface QuizData {
  question: string
  options: string[]
}

export interface QuizResult {
  correct: boolean
  explanation: string
  finished: boolean
  nextQuestion?: QuizData
}

export interface ContextPayload {
  intent: IntentResult
  player?: Player
  team?: NationalTeam
  country?: Country
  trivia?: TriviaItem
  imageUrl?: string
  quizData?: QuizData
  quizResult?: QuizResult
}
