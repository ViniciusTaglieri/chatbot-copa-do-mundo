"use client";

import { CountryCard } from "@/components/CountryCard";
import { MessageBubble } from "@/components/MessageBubble";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamCard } from "@/components/TeamCard";
import { TriviaCard } from "@/components/TriviaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@ai-sdk/react";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CountryCardData, MyUIMessage, PlayerCardData, TeamCardData, TriviaItem } from "@/lib/types";

const WELCOME_MESSAGE =
  "Olá! Eu sou o **Bot da Copa** 🏆\n\nPergunte sobre jogadores, seleções, países ou peça uma curiosidade! Exemplos:\n- Me conta da lenda Ronaldo Fenômeno\n- Fala da Croácia na Copa\n- Me dá uma curiosidade sobre o Brasil";

export function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat<MyUIMessage>();

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input;
    setInput("");

    await sendMessage({ text });
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
              ? msg.parts.filter(
                  (p): p is Extract<typeof p, { type: "text" }> =>
                    p.type === "text",
                )
              : [];

            const fullText =
              textParts.length > 0
                ? textParts.map((p) => p.text).join("")
                : "";

            return (
              <div key={msg.id}>
                {fullText && (
                  <MessageBubble
                    role={msg.role as "user" | "assistant"}
                    content={fullText}
                  />
                )}

                {msg.parts?.map((part, i) => {
                  switch (part.type) {
                    case "data-playerCard":
                      return (
                        <div key={`${msg.id}-card-${i}`} className="mt-2 flex justify-start">
                          <PlayerCard data={part.data as PlayerCardData} />
                        </div>
                      );
                    case "data-teamCard":
                      return (
                        <div key={`${msg.id}-card-${i}`} className="mt-2 flex justify-start">
                          <TeamCard data={part.data as TeamCardData} />
                        </div>
                      );
                    case "data-countryCard":
                      return (
                        <div key={`${msg.id}-card-${i}`} className="mt-2 flex justify-start">
                          <CountryCard data={part.data as CountryCardData} />
                        </div>
                      );
                    case "data-triviaCard":
                      return (
                        <div key={`${msg.id}-card-${i}`} className="mt-2 flex justify-start">
                          <TriviaCard data={part.data as TriviaItem} />
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <MessageBubble
              role="assistant"
              content={`Ops! ${error.message || "Ocorreu um erro ao processar sua mensagem. Tente novamente."}`}
            />
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
  );
}
