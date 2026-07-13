# Bot da Copa

Chatbot interativo sobre Copas do Mundo de futebol. Converse com o bot para descobrir estatísticas, curiosidades e informações sobre jogadores, seleções e países.

## Funcionalidades

- **Consulta de Jogadores:** Busca por nome, retorna posição, copas disputadas, gols e seleção
- **Consulta de Seleções:** Informações sobre participações em copas e melhor resultado
- **Dados de País:** Capital, região, população, idiomas e bandeira
- **Curiosidades:** Fatos aleatórios sobre países e Copa do Mundo via API externa
- **Quiz Interativo:** Perguntas geradas por IA sobre história da Copa do Mundo
- **Cards Dinâmicos:** Componentes visuais para jogador, seleção, país e curiosidade
- **Streaming de Respostas:** Respostas em tempo real via Vercel AI SDK
- **Interface Responsiva:** Layout mobile-first com Tailwind CSS e shadcn/ui

## Stack

| Camada                 | Tecnologia                                       |
| ---------------------- | ------------------------------------------------ |
| Framework              | Next.js 16                                       |
| UI                     | React 19, shadcn/ui, Tailwind CSS v4             |
| LLM                    | Groq (llama-3.3-70b-versatile) via Vercel AI SDK |
| Dados                  | Zafronix API, REST Countries, SerpAPI, Wikimedia |
| Testes                 | Vitest                                           |
| Gerenciador de pacotes | pnpm                                             |

## Requisitos

- Node.js >= 18
- pnpm >= 9
- Chave de API Groq (obrigatório)
- Chave de API Zafronix (obrigatório para dados de futebol)
- Chave de API RapidAPI (opcional, para curiosidades de países)
- Chave de API SerpAPI (opcional, para imagens)

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd chatbot-copa-do-mundo

# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env.local
```

## Configuração de Ambiente

Edite o `.env.local` com suas chaves de API:

| Variável                | Obrigatória | Descrição                                                                   |
| ----------------------- | ----------- | --------------------------------------------------------------------------- |
| `GROQ_API_KEY`          | Sim         | Chave de API do Groq para classificação de intenções e geração de respostas |
| `ZAFRONIX_API_KEY`      | Sim         | Chave de API do Zafronix para dados de jogadores, seleções e curiosidades   |
| `ZAFRONIX_API_BASE_URL` | Sim         | URL base da API Zafronix                                                    |
| `RAPIDAPI_KEY`          | Não         | Chave de API RapidAPI para fatos sobre países                               |
| `RAPIDAPI_HOST`         | Não         | Host da API RapidAPI para fatos sobre países                                |
| `SERPAPI_KEY`           | Não         | Chave de API SerpAPI para busca de imagens                                  |
| `NEXT_PUBLIC_APP_NAME`  | Não         | Nome da aplicação                                                           |

## Como Rodar

### Desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
```

### Produção

```bash
pnpm start
```

### Testes

```bash
pnpm test          # Executa uma vez
pnpm test:watch    # Modo watch
```

### Lint

```bash
pnpm lint
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # API principal de chat (streaming)
│   │   └── health/route.ts    # Endpoint de health check
│   ├── globals.css             # Estilos globais e variáveis de tema
│   ├── layout.tsx              # Layout raiz
│   └── page.tsx                # Página principal
├── components/
│   ├── ui/                     # Componentes shadcn/ui (button, card, input, scroll-area)
│   ├── ChatWindow.tsx          # Janela principal do chat
│   ├── MessageBubble.tsx       # Balão de mensagem
│   ├── PlayerCard.tsx          # Card de jogador
│   ├── TeamCard.tsx            # Card de seleção
│   ├── CountryCard.tsx         # Card de país
│   ├── TriviaCard.tsx          # Card de curiosidade
│   └── ImageBentoGrid.tsx      # Grid de imagens responsivo
├── lib/
│   ├── types/index.ts          # Definições de tipos TypeScript
│   ├── cache.ts                # Cache in-memory genérico
│   ├── card-stream.ts          # Construção de card data parts
│   ├── utils.ts                # Utilitários (cn para Tailwind)
│   └── services/
│       ├── GroqLLMService.ts   # Integração com Groq LLM
│       ├── IntentService.ts    # Classificação de intenções
│       ├── WorldCupDataService.ts # Dados de jogadores e seleções
│       ├── CountryDataService.ts  # Dados de países
│       ├── ImageService.ts     # Busca de imagens (SerpAPI + Wikimedia)
│       └── QuizService.ts      # Serviço de quiz
└── __tests__/                  # Testes unitários
    ├── cache.test.ts
    ├── card-stream.test.ts
    ├── image-service.test.ts
    ├── intent-service.test.ts
    ├── worldcup-data-service.test.ts
    └── quiz-service.test.ts
```

## Fluxo Principal

1. Usuário digita mensagem no `ChatWindow`
2. Mensagem é enviada via `useChat` (Vercel AI SDK) para `/api/chat`
3. API classifica a intenção via Groq LLM (com fallback keyword)
4. Dependendo da intenção, busca dados em services externos
5. Monta `ContextPayload` com dados estruturados
6. Envia resposta streaming via Groq LLM com contexto injetado no system prompt
7. Card data parts são enviadas junto com a resposta para renderização
8. Frontend renderiza cards dinamicamente baseado nos parts recebidos

## Endpoints

| Método | Rota          | Descrição                                  |
| ------ | ------------- | ------------------------------------------ |
| POST   | `/api/chat`   | Envia mensagem e recebe resposta streaming |
| GET    | `/api/health` | Health check da aplicação                  |

## Exemplos de Uso

```
Usuário: "Me conta do Ronaldo Fenômeno"
-> Classifica como "player", busca dados, retorna card + texto narrativo

Usuário: "Fala da Croácia na Copa"
-> Classifica como "team", busca dados da seleção, retorna card + texto

Usuário: "Me dá uma curiosidade"
-> Classifica como "trivia", retorna fato aleatório + card

Usuário: "Vamos fazer um quiz?"
-> Classifica como "quiz", gera pergunta com opções

Usuário: "Capital da França?"
-> Classifica como "country", retorna dados do país + card
```

## Melhorias Futuras

- Persistência de sessão do quiz (Redis ou banco)
- Histórico de conversas com persistência
- Suporte a múltiplos idiomas
- Modo offline com dados estáticos
- Testes E2E com Playwright
- Deploy automático via Vercel
- Monitoramento de erros (Sentry)
- Rate limiting nas APIs externas
