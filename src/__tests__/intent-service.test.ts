import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@ai-sdk/groq", () => ({
  groq: vi.fn(() => "mocked-model"),
}))

vi.mock("ai", () => ({
  generateText: vi.fn(),
}))

describe("IntentService keyword-based fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fall back to keyword classification when LLM fails", async () => {
    const { generateText } = await import("ai")
    vi.mocked(generateText).mockRejectedValue(new Error("API error"))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Me fala do Ronaldo Fenômeno")

    expect(result.type).toBe("player")
  })

  it("should classify quiz intent via keywords", async () => {
    const { generateText } = await import("ai")
    vi.mocked(generateText).mockRejectedValue(new Error("API error"))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Vamos fazer um quiz sobre Copa?")

    expect(result.type).toBe("quiz")
  })

  it("should classify trivia intent via keywords", async () => {
    const { generateText } = await import("ai")
    vi.mocked(generateText).mockRejectedValue(new Error("API error"))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Me conta uma curiosidade sobre futebol")

    expect(result.type).toBe("trivia")
  })

  it("should classify general intent when no keywords match", async () => {
    const { generateText } = await import("ai")
    vi.mocked(generateText).mockRejectedValue(new Error("API error"))

    const { classifyIntent } = await import("@/lib/services/IntentService")
    const result = await classifyIntent("Obrigado!")

    expect(result.type).toBe("general")
  })
})
