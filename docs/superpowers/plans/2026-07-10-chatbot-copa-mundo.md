# Chatbot Copa do Mundo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Brazilian Portuguese chatbot about World Cup football with real player/team/country data, images, and trivia powered by Groq LLM.

**Architecture:** Next.js App Router with `/api/chat` as the single orchestration endpoint. IntentService classifies user messages, domain services fetch data from external APIs, and GroqLLMService generates narrative responses with streaming. Frontend renders chat bubbles and rich cards (player, team, country, trivia).

**Tech Stack:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Groq Cloud (llama-3.3-70b-versatile) via Vercel AI SDK, Zafronix World Cup API, RESTCountries v3.1, Global Fun Facts API (RapidAPI), Wikimedia Commons API, Vercel (hosting)

---

### Task 1: Scaffold Next.js project and install dependencies

**Files:**
- Create: `.env.local`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/lib/utils.ts`
- Create: `components.json`

- [ ] **Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with `src/` directory, TypeScript, Tailwind configured.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @ai-sdk/groq ai @radix-ui/react-dialog @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate
```

Expected: All chat, UI, and utility packages installed.

- [ ] **Step 3: Create .env.local**

Create `.env.local`:
```bash
GROQ_API_KEY=
ZAFRONIX_API_KEY=
# NOTA: Substitua pela URL real fornecida no cadastro da Zafronix
ZAFRONIX_API_BASE_URL=https://zafronix-api.example.com/v1
RAPIDAPI_KEY=
RAPIDAPI_HOST=world-fun-facts-multilanguage.p.rapidapi.com
GOOGLE_CX=
GOOGLE_API_KEY=
NEXT_PUBLIC_APP_NAME="Bot da Copa"
```

- [ ] **Step 4: Configure shadcn UI**

Create `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@components",
    "utils": "@lib/utils"
  }
}
```

- [ ] **Step 5: Create utils helper**

Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 6: Set up globals.css with Tailwind directives**

Write `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 7: Create root layout**

Write `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bot da Copa",
  description: "Seu chatbot sobre Copas do Mundo de futebol",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Verify project runs**

```bash
npm run dev
```

Expected: Dev server starts on `http://localhost:3000` with no errors.

---

### Task 2: Define TypeScript types

**Files:**
- Create: `src/lib/types/index.ts`

- [ ] **Step 1: Create types file**

Write `src/lib/types/index.ts`:
```typescript
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

export interface ContextPayload {
  intent: IntentResult
  player?: Player
  team?: NationalTeam
  country?: Country
  trivia?: TriviaItem
  imageUrl?: string
}
```

- [ ] **Step 2: Create barrel export**

Write `src/lib/types/index.ts` (already covered above — the type definitions are the content).

---

### Task 3: Implement Groq LLM service

**Files:**
- Create: `src/lib/services/GroqLLMService.ts`

- [ ] **Step 1: Create the LLM service**

Write `src/lib/services/GroqLLMService.ts`:
```typescript
import { groq } from "@ai-sdk/groq"
import { streamText, StreamTextResult } from "ai"
import type { ContextPayload } from "../types"

const SYSTEM_PROMPT = `Você é o "Bot da Copa", um chatbot brasileiro apaixonado por Copa do Mundo.
 
Regras:
- Responda SEMPRE em português brasileiro.
- Use os dados estruturados fornecidos como fonte principal. Não invente estatísticas.
- Se um dado não estiver disponível, diga honestamente que não encontrou a informação.
- Seu tom é de um torcedor brasileiro animado, fazendo comentários leves e curiosidades.
- Evite gírias excessivas e termos ofensivos.
- Foque em entretenimento: histórias, curiosidades e contexto histórico.
- Quando houver dados de jogador, mencione posição, edições de Copa, gols e feitos.
- Quando houver dados de seleção, conecte com curiosidades do país quando possível.`

export function generateChatResponse(
  context: ContextPayload,
  userMessage: string
): StreamTextResult<any> {
  const contextJson = JSON.stringify(
    {
      intent: context.intent,
      player: context.player,
      team: context.team,
      country: context.country,
      trivia: context.trivia,
      imageUrl: context.imageUrl,
    },
    null,
    2
  )

  const userPrompt = `Dados estruturados para usar como base:\n${contextJson}\n\nPergunta do usuário:\n"${userMessage}"`

  return streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.8,
    maxTokens: 1024,
  })
}
```

---

### Task 4: Implement Intent Service

**Files:**
- Create: `src/lib/services/IntentService.ts`

- [ ] **Step 1: Create the intent classifier**

Write `src/lib/services/IntentService.ts`:
```typescript
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

  // Extract potential names (words after "do", "da", player/team keywords)
  const namePatterns = [
    ...lower.matchAll(/(?:lenda|craque|jogador|jogadora) ([\w\s]+?)(?: na copa| em \d{4}|$)/gi),
    ...lower.matchAll(/(?:seleção|selecao|time d) ([\w\s]+?)(?: na copa| em \d{4}|$)/gi),
  ]
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

  const entities = extractEntities(lower, bestType)

  return {
    type: bestType,
    confidence: Math.min(bestScore / 3, 1),
    entities,
  }
}
```

---

### Task 5: Implement World Cup Data Service (Zafronix)

**Files:**
- Create: `src/lib/services/WorldCupDataService.ts`

- [ ] **Step 1: Create the service**

Write `src/lib/services/WorldCupDataService.ts`:
```typescript
import type { Player, NationalTeam } from "../types"

const BASE_URL = process.env.ZAFRONIX_API_BASE_URL!
const API_KEY = process.env.ZAFRONIX_API_KEY!

async function fetchFromZafronix(endpoint: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`Zafronix API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function searchPlayer(name: string): Promise<Player | null> {
  try {
    const data = await fetchFromZafronix(`/players/search?q=${encodeURIComponent(name)}`)

    if (!data || data.length === 0) return null

    const p = data[0]
    return {
      id: String(p.id),
      name: p.name,
      countryCode: p.country_code || p.countryCode,
      nationalTeamName: p.national_team || p.nationalTeam,
      position: p.position,
      cupsPlayed: p.world_cups || p.worldCups || [],
      totalGoalsInWorldCups: p.total_goals || p.totalGoals,
      totalMatchesInWorldCups: p.total_matches || p.totalMatches,
    }
  } catch {
    return null
  }
}

export async function getTeamByName(name: string): Promise<NationalTeam | null> {
  try {
    const data = await fetchFromZafronix(`/teams/search?q=${encodeURIComponent(name)}`)

    if (!data || data.length === 0) return null

    const t = data[0]
    return {
      id: String(t.id),
      name: t.name,
      countryCode: t.country_code || t.countryCode,
      cupsParticipated: t.world_cups || t.worldCups || [],
      bestResult: t.best_result || t.bestResult,
    }
  } catch {
    return null
  }
}

export async function getRandomTrivia(): Promise<{ title: string; description: string } | null> {
  try {
    const data = await fetchFromZafronix("/trivia/random")
    if (!data) return null
    return {
      title: data.title || "Curiosidade",
      description: data.description || data.fact || data.text,
    }
  } catch {
    return null
  }
}
```

---

### Task 6: Implement Country Data Service

**Files:**
- Create: `src/lib/services/CountryDataService.ts`

- [ ] **Step 1: Create the service**

Write `src/lib/services/CountryDataService.ts`:
```typescript
import type { Country } from "../types"

const REST_COUNTRIES_BASE = "https://restcountries.com/v3.1"

export async function getCountryByName(name: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `${REST_COUNTRIES_BASE}/name/${encodeURIComponent(name)}?fields=name,cca2,capital,region,population,languages,flags`
    )
    if (!res.ok) return null

    const data = await res.json()
    if (!data || data.length === 0) return null

    const c = data[0]
    return {
      code: c.cca2?.toLowerCase() || "",
      name: c.name?.common || name,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population,
      languages: c.languages ? Object.values(c.languages) : undefined,
      flagUrl: c.flags?.png || c.flags?.svg,
    }
  } catch {
    return null
  }
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `${REST_COUNTRIES_BASE}/alpha/${code.toLowerCase()}?fields=name,cca2,capital,region,population,languages,flags`
    )
    if (!res.ok) return null

    const c = await res.json()
    return {
      code: c.cca2?.toLowerCase() || code,
      name: c.name?.common || code,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population,
      languages: c.languages ? Object.values(c.languages) : undefined,
      flagUrl: c.flags?.png || c.flags?.svg,
    }
  } catch {
    return null
  }
}

export async function getRandomCountryFact(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://world-fun-facts-multilanguage.p.rapidapi.com/fact.php?lang=pt",
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!,
        },
      }
    )
    if (!res.ok) return null

    const data = await res.json()
    return data?.fact || data?.text || data?.description || null
  } catch {
    return null
  }
}
```

---

### Task 7: Implement Image Service (Wikimedia + Google fallback)

**Files:**
- Create: `src/lib/services/ImageService.ts`

- [ ] **Step 1: Create the image service with Wikimedia + Google fallback**

Write `src/lib/services/ImageService.ts`:
```typescript
const WIKIMEDIA_BASE = "https://en.wikipedia.org/w/api.php"
const GOOGLE_CX = process.env.GOOGLE_CX
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

async function searchWikimedia(query: string): Promise<string | null> {
  try {
    const url = `${WIKIMEDIA_BASE}?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    const page = Object.values(pages as Record<string, any>).find(
      (p: any) => p.thumbnail?.source
    )
    return page?.thumbnail?.source || null
  } catch {
    return null
  }
}

async function searchGoogleImages(query: string): Promise<string | null> {
  if (!GOOGLE_CX || !GOOGLE_API_KEY) return null
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&rights=cc_publicdomain&num=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data?.items?.[0]?.link || null
  } catch {
    return null
  }
}

export async function getPlayerImage(playerName: string, teamName?: string): Promise<string | null> {
  const terms = [playerName]
  if (teamName) terms.push(teamName)
  terms.push("footballer")
  const query = terms.join(" ")

  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia

  return searchGoogleImages(`${playerName} ${teamName || ""} footballer`)
}

export async function getTeamImage(teamName: string): Promise<string | null> {
  const query = `${teamName} national football team`
  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia

  return searchGoogleImages(`${teamName} football team`)
}
```

---

### Task 8: Create /api/chat route with full orchestration

**Files:**
- Create: `src/app/api/chat/route.ts`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create health check endpoint**

Write `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "Bot da Copa",
  })
}
```

- [ ] **Step 2: Create chat orchestration route**

Write `src/app/api/chat/route.ts`:
```typescript
import { NextRequest } from "next/server"
import { classifyIntent } from "@/lib/services/IntentService"
import { searchPlayer, getTeamByName, getRandomTrivia } from "@/lib/services/WorldCupDataService"
import { getCountryByName, getCountryByCode, getRandomCountryFact } from "@/lib/services/CountryDataService"
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService"
import { generateChatResponse } from "@/lib/services/GroqLLMService"
import type { ContextPayload } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Mensagem inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const intent = classifyIntent(message)
    const context: ContextPayload = { intent }

    switch (intent.type) {
      case "player": {
        const playerName = intent.entities.playerName || message
        const player = await searchPlayer(playerName)
        if (player) {
          context.player = player
          context.imageUrl = await getPlayerImage(player.name, player.nationalTeamName)
          context.country = await getCountryByName(player.nationalTeamName)
        }
        break
      }

      case "team": {
        const teamName = intent.entities.teamName || message
        const team = await getTeamByName(teamName)
        if (team) {
          context.team = team
          context.imageUrl = await getTeamImage(team.name)
          context.country = await getCountryByCode(team.countryCode)
        }
        break
      }

      case "country": {
        const country = await getCountryByName(message)
        if (country) {
          context.country = country
          const fact = await getRandomCountryFact()
          if (fact) {
            context.trivia = {
              id: "country-fact",
              type: "country",
              title: `Curiosidade sobre ${country.name}`,
              description: fact,
            }
          }
        }
        break
      }

      case "trivia": {
        const countryName = intent.entities.countryName || message.match(/envolvendo o?\s*([\w\s]+)/i)?.[1]
        if (countryName) {
          context.country = await getCountryByName(countryName)
        }
        const fact = await getRandomCountryFact()
        const cupTrivia = await getRandomTrivia()
        const triviaText = fact || cupTrivia?.description
        if (triviaText) {
          context.trivia = {
            id: "random-trivia",
            type: "general",
            title: "Curiosidade",
            description: triviaText,
          }
        }
        break
      }

      case "quiz": {
        // Quiz is handled by the LLM with data context
        const trivia = await getRandomTrivia()
        const fact = await getRandomCountryFact()
        context.trivia = trivia
          ? { id: "quiz-trivia", type: "general", title: trivia.title, description: trivia.description }
          : fact
            ? { id: "quiz-fact", type: "country", title: "Curiosidade", description: fact }
            : undefined
        break
      }

      default:
        break
    }

    const result = generateChatResponse(context, message)

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
```

---

### Task 9: Create shadcn UI primitives

**Files:**
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/scroll-area.tsx`

- [ ] **Step 1: Create Card component**

Write `src/components/ui/card.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 2: Create Button component**

Write `src/components/ui/button.tsx`:
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 3: Create Input component**

Write `src/components/ui/input.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

- [ ] **Step 4: Create ScrollArea component**

Write `src/components/ui/scroll-area.tsx`:
```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
```

---

### Task 10: Create Card Components (Player, Team, Country, Trivia)

**Files:**
- Create: `src/components/PlayerCard.tsx`
- Create: `src/components/TeamCard.tsx`
- Create: `src/components/CountryCard.tsx`
- Create: `src/components/TriviaCard.tsx`

- [ ] **Step 1: Create PlayerCard**

Write `src/components/PlayerCard.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerCardData } from "@/lib/types"

interface Props {
  data: PlayerCardData
}

export function PlayerCard({ data }: Props) {
  const { player, imageUrl } = data

  return (
    <Card className="w-full max-w-sm">
      {imageUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={player.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{player.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Seleção</span>
          <span className="font-medium">{player.nationalTeamName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Posição</span>
          <span className="font-medium">{player.position}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Copas disputadas</span>
          <span className="font-medium">{player.cupsPlayed.join(", ") || "—"}</span>
        </div>
        {player.totalGoalsInWorldCups !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gols em Copas</span>
            <span className="font-medium">{player.totalGoalsInWorldCups}</span>
          </div>
        )}
        {player.totalMatchesInWorldCups !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jogos em Copas</span>
            <span className="font-medium">{player.totalMatchesInWorldCups}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create TeamCard**

Write `src/components/TeamCard.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TeamCardData } from "@/lib/types"

interface Props {
  data: TeamCardData
}

export function TeamCard({ data }: Props) {
  const { team, imageUrl } = data

  return (
    <Card className="w-full max-w-sm">
      {imageUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={team.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Participações em Copas</span>
          <span className="font-medium">{team.cupsParticipated.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Melhor resultado</span>
          <span className="font-medium">{team.bestResult || "—"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create CountryCard**

Write `src/components/CountryCard.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CountryCardData } from "@/lib/types"

interface Props {
  data: CountryCardData
}

export function CountryCard({ data }: Props) {
  const { country } = data

  return (
    <Card className="w-full max-w-sm">
      {country.flagUrl && (
        <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src={country.flagUrl}
            alt={`Bandeira ${country.name}`}
            className="h-full w-full object-contain p-4"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{country.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {country.capital && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital</span>
            <span className="font-medium">{country.capital}</span>
          </div>
        )}
        {country.region && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Região</span>
            <span className="font-medium">{country.region}</span>
          </div>
        )}
        {country.population && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">População</span>
            <span className="font-medium">{country.population.toLocaleString("pt-BR")}</span>
          </div>
        )}
        {country.languages && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idiomas</span>
            <span className="font-medium text-right">{country.languages.join(", ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create TriviaCard**

Write `src/components/TriviaCard.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"
import type { TriviaItem } from "@/lib/types"

interface Props {
  data: TriviaItem
}

export function TriviaCard({ data }: Props) {
  return (
    <Card className="w-full max-w-sm border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">{data.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </CardContent>
    </Card>
  )
}
```

---

### Task 11: Build Chat UI

**Files:**
- Create: `src/components/ChatWindow.tsx`
- Create: `src/components/MessageBubble.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create MessageBubble component**

Write `src/components/MessageBubble.tsx`:
```tsx
"use client"

import { cn } from "@/lib/utils"

interface Props {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: Props) {
  const isUser = role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ChatWindow component (with useChat)**

Write `src/components/ChatWindow.tsx`:
```tsx
"use client"

import { useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "@/components/MessageBubble"
import { PlayerCard } from "@/components/PlayerCard"
import { TeamCard } from "@/components/TeamCard"
import { CountryCard } from "@/components/CountryCard"
import { TriviaCard } from "@/components/TriviaCard"
import { Send, Loader2 } from "lucide-react"
import { extractCardsFromResponse } from "@/lib/stream-parser"
import type { ChatResponse } from "@/lib/types"

export function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Olá! Eu sou o **Bot da Copa** 🏆\n\nPergunte sobre jogadores, seleções, países ou peça uma curiosidade! Exemplos:\n- \"Me conta da lenda Ronaldo Fenômeno\"\n- \"Fala da Croácia na Copa\"\n- \"Me dá uma curiosidade sobre o Brasil\"",
      },
    ],
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function getCardData(content: string): { text: string; cardData?: ChatResponse } {
    return extractCardsFromResponse(content)
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => {
            const { text, cardData } = getCardData(msg.content)
            return (
              <div key={msg.id}>
                <MessageBubble role={msg.role} content={text} />
                {cardData?.playerCard && (
                  <div className="mt-2 flex justify-start">
                    <PlayerCard data={cardData.playerCard} />
                  </div>
                )}
                {cardData?.teamCard && (
                  <div className="mt-2 flex justify-start">
                    <TeamCard data={cardData.teamCard} />
                  </div>
                )}
                {cardData?.countryCard && (
                  <div className="mt-2 flex justify-start">
                    <CountryCard data={cardData.countryCard} />
                  </div>
                )}
                {cardData?.triviaCard && (
                  <div className="mt-2 flex justify-start">
                    <TriviaCard data={cardData.triviaCard} />
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex justify-start">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Pergunte sobre a Copa..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update page.tsx**

Write `src/app/page.tsx`:
```tsx
import { ChatWindow } from "@/components/ChatWindow"

export default function Home() {
  return (
    <main className="flex h-dvh flex-col">
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-center text-lg font-bold">Bot da Copa</h1>
        <p className="text-center text-xs text-muted-foreground">
          Seu chatbot sobre Copas do Mundo
        </p>
      </header>
      <ChatWindow />
    </main>
  )
}
```

---

### Task 12: Create stream parser utility (cards from stream)

**Files:**
- Create: `src/lib/stream-parser.ts`

- [ ] **Step 1: Create stream parser**

Write `src/lib/stream-parser.ts`:
```typescript
import type { ChatResponse } from "./types"

// The LLM response will include JSON metadata for cards at the end
// Format: ---CARDS:{"playerCard":{...}}---
export function extractCardsFromResponse(content: string): {
  text: string
  cards?: ChatResponse
} {
  const cardMatch = content.match(/---CARDS:(\{.+?\})---/)
  if (!cardMatch) {
    return { text: content }
  }

  try {
    const cards = JSON.parse(cardMatch[1]) as ChatResponse
    const text = content.replace(cardMatch[0], "").trim()
    return { text, cards }
  } catch {
    return { text: content }
  }
}
```

---

### Task 13: Add LLM system prompt with card instructions

**Files:**
- Modify: `src/lib/services/GroqLLMService.ts`

- [ ] **Step 1: Update system prompt to include card metadata format**

Edit `src/lib/services/GroqLLMService.ts` to add card formatting instructions to the system prompt:

Find the `SYSTEM_PROMPT` and append:
```
 
Formato de resposta:
- Responda com texto narrativo em português brasileiro.
- Se houver dados de jogador no contexto, inclua ao final:
  ---CARDS:{"playerCard":{"player":<jogador>,"imageUrl":"<url>"}}---
- Se houver dados de seleção no contexto, inclua ao final:
  ---CARDS:{"teamCard":{"team":<time>,"imageUrl":"<url>"}}---
- Se houver dados de país no contexto, inclua ao final:
  ---CARDS:{"countryCard":{"country":<país>}}---
- Se houver curiosidade no contexto, inclua ao final:
  ---CARDS:{"triviaCard":{"id":"trivia","type":"general","title":"<título>","description":"<texto>"}}---
- Você pode combinar múltiplos cards: ---CARDS:{"playerCard":{...},"countryCard":{...}}---
- Use os dados do contexto exatamente como fornecidos para preencher os cards.
```

---

### Task 14: Quiz flow implementation

**Files:**
- Create: `src/lib/services/QuizService.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create QuizService**

Write `src/lib/services/QuizService.ts`:
```typescript
interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Qual país tem mais títulos de Copa do Mundo?",
    options: ["Alemanha", "Brasil", "Itália", "Argentina"],
    correctAnswer: 1,
    explanation: "O Brasil é o maior campeão com 5 títulos (1958, 1962, 1970, 1994, 2002).",
  },
  {
    question: "Em que ano o Brasil sediou a Copa do Mundo pela última vez?",
    options: ["1950", "2014", "1978", "2006"],
    correctAnswer: 1,
    explanation: "O Brasil sediou a Copa em 2014, quando a Alemanha foi campeã.",
  },
  {
    question: "Qual jogador tem mais gols em Copas do Mundo?",
    options: ["Ronaldo Fenômeno", "Pelé", "Miroslav Klose", "Just Fontaine"],
    correctAnswer: 2,
    explanation: "Miroslav Klose tem 16 gols em Copas, seguido por Ronaldo com 15.",
  },
  {
    question: "Quantas Copas do Mundo já foram realizadas até 2022?",
    options: ["20", "22", "18", "25"],
    correctAnswer: 1,
    explanation: "A Copa de 2022 no Catar foi a 22ª edição do torneio.",
  },
  {
    question: "Qual seleção foi campeã da Copa de 1998?",
    options: ["Brasil", "França", "Itália", "Argentina"],
    correctAnswer: 1,
    explanation: "A França venceu o Brasil por 3 a 0 na final de 1998, em Paris.",
  },
]

let currentQuestionIndex = -1
let sessionQuestions: QuizQuestion[] = []

export function startQuiz(): { question: string; options: string[] } {
  // Shuffle and pick questions
  sessionQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5)
  currentQuestionIndex = 0

  const q = sessionQuestions[0]
  return {
    question: q.question,
    options: q.options,
  }
}

export function answerQuiz(
  userAnswer: string
): { correct: boolean; explanation: string; finished: boolean; nextQuestion?: { question: string; options: string[] } } {
  const currentQuestion = sessionQuestions[currentQuestionIndex]
  if (!currentQuestion) {
    return { correct: false, explanation: "Quiz não iniciado.", finished: true }
  }

  const answerIndex = parseInt(userAnswer)
  const isCorrect = answerIndex === currentQuestion.correctAnswer

  currentQuestionIndex++

  if (currentQuestionIndex >= sessionQuestions.length) {
    sessionQuestions = []
    currentQuestionIndex = -1
    return {
      correct: isCorrect,
      explanation: currentQuestion.explanation,
      finished: true,
    }
  }

  const nextQ = sessionQuestions[currentQuestionIndex]
  return {
    correct: isCorrect,
    explanation: currentQuestion.explanation,
    finished: false,
    nextQuestion: {
      question: nextQ.question,
      options: nextQ.options,
    },
  }
}

export function isQuizActive(): boolean {
  return currentQuestionIndex >= 0 && currentQuestionIndex < sessionQuestions.length
}
```

- [ ] **Step 2: Wire quiz into chat route**

Edit `src/app/api/chat/route.ts` — update the quiz case in the switch statement:

Replace the quiz case with:
```typescript
case "quiz": {
  const { startQuiz, answerQuiz, isQuizActive } = await import("@/lib/services/QuizService")

  if (isQuizActive()) {
    // Try to parse answer from message
    const answerMatch = message.match(/^(\d)$/)
    if (answerMatch) {
      const result = answerQuiz(answerMatch[1])
      context.quizResult = result
    } else {
      // Treat as new quiz request
      const quizData = startQuiz()
      context.quizData = quizData
    }
  } else {
    const quizData = startQuiz()
    context.quizData = quizData
  }
  break
}
```

Note: This requires adding `quizData` and `quizResult` to `ContextPayload`.

- [ ] **Step 3: Add quiz fields to ContextPayload**

Edit `src/lib/types/index.ts` — add to `ContextPayload`:
```typescript
quizData?: {
  question: string
  options: string[]
}
quizResult?: {
  correct: boolean
  explanation: string
  finished: boolean
  nextQuestion?: {
    question: string
    options: string[]
  }
}
```

---

### Task 15: Error handling and polish

**Files:**
- Create: `src/lib/cache.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create simple in-memory cache**

Write `src/lib/cache.ts`:
```typescript
const cache = new Map<string, { data: any; expiresAt: number }>()

const DEFAULT_TTL_MS = 30 * 60 * 1000 // 30 minutes

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setToCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function clearCache(): void {
  cache.clear()
}
```

- [ ] **Step 2: Add caching to WorldCupDataService**

Edit `src/lib/services/WorldCupDataService.ts` — add cache wrappers:

Add import at top:
```typescript
import { getFromCache, setToCache } from "../cache"
```

Wrap `searchPlayer`:
```typescript
export async function searchPlayer(name: string): Promise<Player | null> {
  const cacheKey = `player:${name.toLowerCase()}`
  const cached = getFromCache<Player>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFromZafronix(`/players/search?q=${encodeURIComponent(name)}`)
    if (!data || data.length === 0) return null

    const p = data[0]
    const player: Player = {
      id: String(p.id),
      name: p.name,
      countryCode: p.country_code || p.countryCode,
      nationalTeamName: p.national_team || p.nationalTeam,
      position: p.position,
      cupsPlayed: p.world_cups || p.worldCups || [],
      totalGoalsInWorldCups: p.total_goals || p.totalGoals,
      totalMatchesInWorldCups: p.total_matches || p.totalMatches,
    }

    setToCache(cacheKey, player)
    return player
  } catch {
    return null
  }
}
```

Wrap `getTeamByName`:
```typescript
export async function getTeamByName(name: string): Promise<NationalTeam | null> {
  const cacheKey = `team:${name.toLowerCase()}`
  const cached = getFromCache<NationalTeam>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFromZafronix(`/teams/search?q=${encodeURIComponent(name)}`)
    if (!data || data.length === 0) return null

    const t = data[0]
    const team: NationalTeam = {
      id: String(t.id),
      name: t.name,
      countryCode: t.country_code || t.countryCode,
      cupsParticipated: t.world_cups || t.worldCups || [],
      bestResult: t.best_result || t.bestResult,
    }

    setToCache(cacheKey, team)
    return team
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Add error handling in route**

Edit `src/app/api/chat/route.ts` — ensure the try/catch returns proper error responses:

The current route already has try/catch. Verify the error response matches:
```typescript
return new Response(
  JSON.stringify({ error: "Erro interno. Tente novamente." }),
  {
    status: 500,
    headers: { "Content-Type": "application/json" },
  }
)
```

---

### Task 16: Final integration test and build

**Files:**
- Modify: `src/app/api/chat/route.ts` (if needed)

- [ ] **Step 1: TypeScript compilation check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Start dev server and test**

```bash
npm run dev
```

Expected: Dev server runs. Open `http://localhost:3000` and test:
1. Send "Olá" → assistant responds in PT-BR
2. Send "Me conta do Ronaldo Fenômeno" → triggers player intent
3. Send "Fala da Croácia" → triggers team/country intent
4. Send "Me dá uma curiosidade" → triggers trivia intent
