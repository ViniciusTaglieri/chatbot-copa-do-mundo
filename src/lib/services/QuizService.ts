import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

const QUIZ_GENERATION_PROMPT = `Gere uma pergunta de quiz sobre Copa do Mundo de futebol em português brasileiro.
Retorne APENAS um JSON no formato:
{"question": "<pergunta>", "options": ["<opção1>", "<opção2>", "<opção3>", "<opção4>"], "correctAnswer": <índice da resposta correta (0-3)>, "explanation": "<explicação>"}

Regras:
- A pergunta deve ser sobre Copa do Mundo (jogadores, seleções, finais, recordes, etc)
- Opções devem ser plausíveis (não óbvias)
- O explanation deve ser educativo e curto
- Retorne APENAS o JSON, sem texto adicional`

interface QuizSession {
  currentQuestionIndex: number
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
}

const sessions = new Map<string, QuizSession>()

function getOrCreateSession(sessionId: string): QuizSession {
  let session = sessions.get(sessionId)
  if (!session) {
    session = { currentQuestionIndex: -1, questions: [] }
    sessions.set(sessionId, session)
  }
  return session
}

async function generateQuizQuestion(): Promise<{
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
} | null> {
  try {
    const { text: raw } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: QUIZ_GENERATION_PROMPT,
      temperature: 0.9,
      maxOutputTokens: 300,
    })

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export async function startQuiz(sessionId: string = "default"): Promise<{ question: string; options: string[] }> {
  const session = getOrCreateSession(sessionId)
  const firstQuestion = await generateQuizQuestion()
  if (!firstQuestion) {
    return {
      question: "Qual país tem mais títulos de Copa do Mundo?",
      options: ["Alemanha", "Brasil", "Itália", "Argentina"],
    }
  }

  session.questions = [firstQuestion]
  session.currentQuestionIndex = 0

  return {
    question: firstQuestion.question,
    options: firstQuestion.options,
  }
}

export async function answerQuiz(
  userAnswer: string,
  sessionId: string = "default"
): Promise<{
  correct: boolean
  explanation: string
  finished: boolean
  nextQuestion?: { question: string; options: string[] }
}> {
  const session = getOrCreateSession(sessionId)
  const currentQuestion = session.questions[session.currentQuestionIndex]
  if (!currentQuestion) {
    return { correct: false, explanation: "Quiz não iniciado.", finished: true }
  }

  const answerIndex = parseInt(userAnswer)
  const isCorrect = answerIndex === currentQuestion.correctAnswer

  session.currentQuestionIndex++

  if (session.currentQuestionIndex >= session.questions.length) {
    const nextQ = await generateQuizQuestion()
    if (nextQ) {
      session.questions.push(nextQ)
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

    session.currentQuestionIndex = -1
    session.questions = []
    return {
      correct: isCorrect,
      explanation: currentQuestion.explanation,
      finished: true,
    }
  }

  const nextQ = session.questions[session.currentQuestionIndex]
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

export function isQuizActive(sessionId: string = "default"): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  return session.currentQuestionIndex >= 0 && session.currentQuestionIndex < session.questions.length
}
