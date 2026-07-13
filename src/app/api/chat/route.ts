import {
  getCountryByCode,
  getCountryByName,
  getRandomCountryFact,
} from "@/lib/services/CountryDataService";
import { generateChatResponse } from "@/lib/services/GroqLLMService";
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService";
import { classifyIntent } from "@/lib/services/IntentService";
import {
  getRandomTrivia,
  getTeamByName,
  searchPlayer,
} from "@/lib/services/WorldCupDataService";
import type { ContextPayload } from "@/lib/types";
import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextRequest } from "next/server";

function extractTextFromMessage(message: { content?: unknown; parts?: unknown[] }): string {
  if (typeof message.content === "string") return message.content.trim();

  if (!Array.isArray(message.parts)) return "";

  return message.parts
    .filter((p): p is { type: "text"; text: string } => (p as any)?.type === "text" && typeof (p as any)?.text === "string")
    .map((p) => (p as { text: string }).text)
    .join("")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = extractTextFromMessage(lastMessage);

    if (!userMessage) {
      return Response.json({ error: "Mensagem inválida" }, { status: 400 });
    }

    const intent = await classifyIntent(userMessage);
    const context: ContextPayload = { intent };

    switch (intent.type) {
      case "player": {
        const playerName = intent.entities.playerName || userMessage;
        const player = await searchPlayer(playerName);
        if (player) {
          context.player = player;
          context.imageUrl =
            (await getPlayerImage(player.name, player.nationalTeamName)) ??
            undefined;
          context.country =
            (await getCountryByName(player.nationalTeamName)) ?? undefined;
        }
        break;
      }

      case "team": {
        const teamName = intent.entities.teamName || userMessage;
        const team = await getTeamByName(teamName);
        if (team) {
          context.team = team;
          context.imageUrl = (await getTeamImage(team.name)) ?? undefined;
          context.country =
            (await getCountryByCode(team.countryCode)) ?? undefined;
        }
        break;
      }

      case "country": {
        const country = await getCountryByName(userMessage);
        if (country) {
          context.country = country;
          const fact = await getRandomCountryFact();
          if (fact) {
            context.trivia = {
              id: "country-fact",
              type: "country",
              title: `Curiosidade sobre ${country.name}`,
              description: fact,
            };
          }
        }
        break;
      }

      case "trivia": {
        const countryName =
          intent.entities.countryName ||
          userMessage.match(/envolvendo o?\s*([\w\s]+)/i)?.[1];

        if (countryName) {
          context.country = (await getCountryByName(countryName)) ?? undefined;
        }

        const fact = await getRandomCountryFact();
        const cupTrivia = await getRandomTrivia();
        const triviaText = fact || cupTrivia?.description;

        if (triviaText) {
          context.trivia = {
            id: "random-trivia",
            type: "general",
            title: "Curiosidade",
            description: triviaText,
          };
        }
        break;
      }

      case "quiz": {
        const { startQuiz, answerQuiz, isQuizActive } =
          await import("@/lib/services/QuizService");

        const answerMatch = userMessage.match(/^(\d)$/);
        if (isQuizActive() && answerMatch) {
          context.quizResult = await answerQuiz(answerMatch[1]);
        } else {
          context.quizData = await startQuiz();
        }
        break;
      }

      default:
        break;
    }

    const history = messages
      .slice(0, -1)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.parts
          ?.filter((p) => p.type === "text")
          .map((p) => (p as Extract<typeof p, { type: "text" }>).text)
          .join("") ?? "",
      }))
      .filter((m) => m.content.length > 0);

    const result = generateChatResponse(context, userMessage, history);

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
      }),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
