import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"
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
- Quando houver dados de seleção, conecte com curiosidades do país quando possível.
- Se houver dados de quiz no contexto, formate a resposta como pergunta com opções numeradas.
- Se houver resultado de quiz, explique se acertou ou errou e dê a explicação.

IMPORTANTE: Responda APENAS com o texto narrativo. NÃO inclua JSON, cards ou marcadores especiais.`

const MAX_HISTORY_MESSAGES = 20

interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

export function generateChatResponse(
  context: ContextPayload,
  userMessage: string,
  history: HistoryMessage[] = []
) {
  const contextJson = JSON.stringify(
    {
      intent: context.intent,
      player: context.player,
      team: context.team,
      country: context.country,
      trivia: context.trivia,
      images: context.images,
      quizData: context.quizData,
      quizResult: context.quizResult,
    },
    null,
    2
  )

  const systemMessage = `${SYSTEM_PROMPT}\n\nDados estruturados para usar como base:\n${contextJson}`

  const limitedHistory = history.slice(-MAX_HISTORY_MESSAGES)

  const messages = [
    ...limitedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ]

  return streamText({
    model: groq("llama-3.3-70b-versatile"),
    instructions: systemMessage,
    messages,
    temperature: 0.8,
    maxOutputTokens: 1024,
  })
}
