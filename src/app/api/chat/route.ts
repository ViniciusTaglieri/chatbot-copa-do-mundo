import { buildCardDataParts } from "@lib/card-stream";
import {
  getCountryByCode,
  getCountryByName,
  getRandomCountryFact,
} from "@lib/services/CountryDataService";
import { generateChatResponse } from "@lib/services/GroqLLMService";
import { searchImages } from "@lib/services/ImageService";
import { classifyIntent } from "@lib/services/IntentService";
import {
  getRandomTrivia,
  getTeamByName,
  searchPlayer,
} from "@lib/services/WorldCupDataService";
import type { ContextPayload, IntentResult } from "@lib/types";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextRequest } from "next/server";

function extractTextFromMessage(message: {
  content?: unknown;
  parts?: unknown[];
}): string {
  if (typeof message.content === "string") return message.content.trim();

  if (!Array.isArray(message.parts)) return "";

  return message.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        (p as { type?: unknown; text?: unknown })?.type === "text" &&
        typeof (p as { type?: unknown; text?: unknown })?.text === "string",
    )
    .map((p) => (p as { text: string }).text)
    .join("")
    .trim();
}

async function resolvePlayerContext(
  context: ContextPayload,
  intent: IntentResult,
  userMessage: string,
): Promise<ContextPayload> {
  const playerName = intent.entities.playerName || userMessage;
  const player = await searchPlayer(playerName);

  if (player) {
    context.player = player;
  } else {
    context.player = {
      id: "unknown",
      name: playerName,
      countryCode: "",
      nationalTeamName: "",
      position: "",
    };
  }

  const searchQuery = player
    ? `${player.name} ${player.nationalTeamName} football`
    : `${playerName} football player`;
  const playerImages = await searchImages(searchQuery, 3);
  context.images = playerImages.map((img) => img.url);

  if (player) {
    context.country =
      (await getCountryByName(player.nationalTeamName)) ?? undefined;
  }

  return context;
}

async function resolveTeamContext(
  context: ContextPayload,
  intent: IntentResult,
  userMessage: string,
): Promise<ContextPayload> {
  const teamName = intent.entities.teamName || userMessage;
  const team = await getTeamByName(teamName);

  if (team) {
    context.team = team;
  } else {
    context.team = {
      id: "unknown",
      name: teamName,
      countryCode: "",
    };
  }

  const searchQuery = team
    ? `${team.name} national football team`
    : `${teamName} national football team`;
  const teamImages = await searchImages(searchQuery, 3);
  context.images = teamImages.map((img) => img.url);

  if (team) {
    context.country =
      (await getCountryByCode(team.countryCode)) ?? undefined;
  }

  return context;
}

async function resolveCountryContext(
  context: ContextPayload,
  userMessage: string,
): Promise<ContextPayload> {
  const country = await getCountryByName(userMessage);
  if (country) {
    context.country = country;
  }

  const searchQuery = country
    ? `${country.name} country flag football`
    : `${userMessage} country flag football`;
  const countryImages = await searchImages(searchQuery, 3);
  context.images = countryImages.map((img) => img.url);

  const countryName = country?.name || userMessage;

  if (!country) {
    context.country = {
      code: "",
      name: userMessage,
    };
  }

  const fact = await getRandomCountryFact();
  if (fact) {
    context.trivia = {
      id: "country-fact",
      type: "country",
      title: `Curiosidade sobre ${countryName}`,
      description: fact,
    };
  }

  return context;
}

async function resolveTriviaContext(
  context: ContextPayload,
  intent: IntentResult,
  userMessage: string,
): Promise<ContextPayload> {
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
  return context;
}

async function resolveQuizContext(
  context: ContextPayload,
  req: NextRequest,
  userMessage: string,
): Promise<ContextPayload> {
  const { startQuiz, answerQuiz, isQuizActive } =
    await import("@lib/services/QuizService");

  const sessionId =
    req.headers.get("x-session-id") ||
    req.headers.get("x-forwarded-for") ||
    "default";
  const answerMatch = userMessage.match(/^(\d)$/);
  if (isQuizActive(sessionId) && answerMatch) {
    context.quizResult = await answerQuiz(answerMatch[1], sessionId);
  } else {
    context.quizData = await startQuiz(sessionId);
  }
  return context;
}

async function resolveContext(
  intent: IntentResult,
  userMessage: string,
  req: NextRequest,
): Promise<ContextPayload> {
  const context: ContextPayload = { intent };
  switch (intent.type) {
    case "player":
      return resolvePlayerContext(context, intent, userMessage);
    case "team":
      return resolveTeamContext(context, intent, userMessage);
    case "country":
      return resolveCountryContext(context, userMessage);
    case "trivia":
      return resolveTriviaContext(context, intent, userMessage);
    case "quiz":
      return resolveQuizContext(context, req, userMessage);
    default:
      return context;
  }
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
    const context = await resolveContext(intent, userMessage, req);

    const history = messages
      .slice(0, -1)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content:
          m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("") ?? "",
      }))
      .filter((m) => m.content.length > 0);

    const cardParts = buildCardDataParts(context);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = generateChatResponse(context, userMessage, history);
        const uiStream = toUIMessageStream({ stream: result.stream });
        const reader = uiStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value.type === "finish") {
            for (const part of cardParts) {
              writer.write(part as never);
            }
          }

          writer.write(value as never);
        }
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Chat API error [${errorId}]:`, error);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente.", errorId }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
