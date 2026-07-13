export interface Player {
  id: string
  name: string
  countryCode: string
  nationalTeamName: string
  position: string
  cupsPlayed?: number[]
  totalGoalsInWorldCups?: number
  totalMatchesInWorldCups?: number
}

export interface NationalTeam {
  id: string
  name: string
  countryCode: string
  cupsParticipated?: number[]
  bestResult?: string
}

export interface ImageResult {
  url: string
  thumbnail?: string
  source: 'serpapi' | 'wikimedia'
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
  images: string[]
}

export interface TeamCardData {
  team: NationalTeam
  images: string[]
}

export interface CountryCardData {
  country: Country
  images: string[]
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
  images?: string[]
  quizData?: QuizData
  quizResult?: QuizResult
}

export type ChatCardDataParts = {
  playerCard: PlayerCardData
  teamCard: TeamCardData
  countryCard: CountryCardData
  triviaCard: TriviaItem
}

export type MyUIMessage = import("ai").UIMessage<
  never,
  {
    playerCard: PlayerCardData
    teamCard: TeamCardData
    countryCard: CountryCardData
    triviaCard: TriviaItem
  }
>
