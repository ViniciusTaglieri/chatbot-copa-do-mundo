import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@ai-sdk/groq", () => ({
  groq: vi.fn(() => "mocked-model"),
}))

vi.mock("ai", () => ({
  generateText: vi.fn(),
}))

describe("QuizService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("startQuiz", () => {
    it("should start quiz with generated question", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: '{"question":"Quem ganhou 2002?","options":["Brasil","Alemanha","França","Itália"],"correctAnswer":0,"explanation":"Brasil ganhou"}',
      } as unknown as { text: string })

      const { startQuiz } = await import("@/lib/services/QuizService")
      const result = await startQuiz("test-session")

      expect(result.question).toContain("2002")
      expect(result.options).toHaveLength(4)
    })

    it("should fallback to default question when LLM fails", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockRejectedValue(new Error("API error"))

      const { startQuiz } = await import("@/lib/services/QuizService")
      const result = await startQuiz("test-session-fallback")

      expect(result.question).toContain("títulos")
      expect(result.options).toHaveLength(4)
    })
  })

  describe("isQuizActive", () => {
    it("should return false when no session exists", async () => {
      const { isQuizActive } = await import("@/lib/services/QuizService")
      expect(isQuizActive("nonexistent-session")).toBe(false)
    })
  })

  describe("answerQuiz", () => {
    it("should return finished when no quiz started", async () => {
      const { answerQuiz } = await import("@/lib/services/QuizService")
      const result = await answerQuiz("1", "no-session")

      expect(result.finished).toBe(true)
      expect(result.correct).toBe(false)
      expect(result.explanation).toContain("não iniciado")
    })
  })
})
