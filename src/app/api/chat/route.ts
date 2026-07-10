import { NextRequest } from "next/server"
import { classifyIntent } from "@/lib/services/IntentService"
import { searchPlayer, getTeamByName, getRandomTrivia } from "@/lib/services/WorldCupDataService"
import { getCountryByName, getCountryByCode, getRandomCountryFact } from "@/lib/services/CountryDataService"
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService"
import { generateChatResponse } from "@/lib/services/GroqLLMService"
import { createUIMessageStreamResponse, toUIMessageStream, type UIMessage } from "ai"
import type { ContextPayload } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage?.content
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(JSON.stringify({ error: "Mensagem inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const intent = await classifyIntent(userMessage)
    const context: ContextPayload = { intent }

    switch (intent.type) {
      case "player": {
        const playerName = intent.entities.playerName || userMessage
        const player = await searchPlayer(playerName)
        if (player) {
          context.player = player
          context.imageUrl = (await getPlayerImage(player.name, player.nationalTeamName)) ?? undefined
          context.country = (await getCountryByName(player.nationalTeamName)) ?? undefined
        }
        break
      }

      case "team": {
        const teamName = intent.entities.teamName || userMessage
        const team = await getTeamByName(teamName)
        if (team) {
          context.team = team
          context.imageUrl = (await getTeamImage(team.name)) ?? undefined
          context.country = (await getCountryByCode(team.countryCode)) ?? undefined
        }
        break
      }

      case "country": {
        const country = await getCountryByName(userMessage)
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
        const countryName = intent.entities.countryName || userMessage.match(/envolvendo o?\s*([\w\s]+)/i)?.[1]
        if (countryName) {
          context.country = (await getCountryByName(countryName)) ?? undefined
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
        const { startQuiz, answerQuiz, isQuizActive } = await import("@/lib/services/QuizService")

        if (isQuizActive()) {
          const answerMatch = userMessage.match(/^(\d)$/)
          if (answerMatch) {
            const result = await answerQuiz(answerMatch[1])
            context.quizResult = result
          } else {
            const quizData = await startQuiz()
            context.quizData = quizData
          }
        } else {
          const quizData = await startQuiz()
          context.quizData = quizData
        }
        break
      }

      default:
        break
    }

    const history = messages.slice(0, -1).map((m: UIMessage) => ({
      role: m.role as "user" | "assistant",
      content: m.parts
        ? m.parts.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text").map(p => p.text).join("")
        : (m as any).content || "",
    })).filter((m: { role: string; content: string }) => m.content.length > 0)

    const result = generateChatResponse(context, userMessage, history)

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    })
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
