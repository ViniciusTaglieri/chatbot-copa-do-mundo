import { NextRequest } from "next/server"
import { classifyIntent } from "@/lib/services/IntentService"
import { searchPlayer, getTeamByName, getRandomTrivia } from "@/lib/services/WorldCupDataService"
import { getCountryByName, getCountryByCode, getRandomCountryFact } from "@/lib/services/CountryDataService"
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService"
import { generateChatResponse } from "@/lib/services/GroqLLMService"
import { createUIMessageStreamResponse, toUIMessageStream } from "ai"
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
          context.imageUrl = (await getPlayerImage(player.name, player.nationalTeamName)) ?? undefined
          context.country = (await getCountryByName(player.nationalTeamName)) ?? undefined
        }
        break
      }

      case "team": {
        const teamName = intent.entities.teamName || message
        const team = await getTeamByName(teamName)
        if (team) {
          context.team = team
          context.imageUrl = (await getTeamImage(team.name)) ?? undefined
          context.country = (await getCountryByCode(team.countryCode)) ?? undefined
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
          const answerMatch = message.match(/^(\d)$/)
          if (answerMatch) {
            const result = answerQuiz(answerMatch[1])
            context.quizResult = result
          } else {
            const quizData = startQuiz()
            context.quizData = quizData
          }
        } else {
          const quizData = startQuiz()
          context.quizData = quizData
        }
        break
      }

      default:
        break
    }

    const result = generateChatResponse(context, message)

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
