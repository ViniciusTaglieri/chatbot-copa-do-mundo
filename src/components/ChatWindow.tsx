"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
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

const WELCOME_MESSAGE = "Olá! Eu sou o **Bot da Copa** 🏆\n\nPergunte sobre jogadores, seleções, países ou peça uma curiosidade! Exemplos:\n- Me conta da lenda Ronaldo Fenômeno\n- Fala da Croácia na Copa\n- Me dá uma curiosidade sobre o Brasil"

export function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")
  const { messages, sendMessage, status } = useChat({
    transport: undefined,
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <MessageBubble role="assistant" content={WELCOME_MESSAGE} />
          )}
          {messages.map((msg) => {
            const textParts = msg.parts
              ? msg.parts.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
              : []
            const fullText = textParts.length > 0
              ? textParts.map((p) => p.text).join("")
              : (msg as any).content || ""
            const { text, cardData } = extractCardsFromResponse(fullText)
            return (
              <div key={msg.id}>
                <MessageBubble role={msg.role as "user" | "assistant"} content={text} />
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
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
