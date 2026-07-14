import { ChatWindow } from "@components/ChatWindow"

export default function Home() {
  return (
    <main className="flex h-dvh flex-col">
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-center text-lg font-bold">Bot da Copa</h1>
        <p className="text-center text-xs text-muted-foreground">
          Seu chatbot sobre Copas do Mundo
        </p>
      </header>
      <ChatWindow />
    </main>
  )
}
