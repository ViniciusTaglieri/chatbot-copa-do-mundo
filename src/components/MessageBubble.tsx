"use client"

import { cn } from "@/lib/utils"

interface Props {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: Props) {
  const isUser = role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}
