# Image Search System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broken single-image Wikimedia lookup with a robust SerpAPI (Google Images) + Wikimedia fallback system returning up to 3 images in a bento grid layout.

**Architecture:** SerpAPI as primary image provider with in-memory cache, Wikimedia as fallback. New `ImageBentoGrid` component renders 1 large + 2 small images. Types updated from singular `imageUrl` to `images: string[]`.

**Tech Stack:** TypeScript, Next.js 16, Vercel AI SDK v7, SerpAPI (Google Images), Wikimedia API, Vitest, Tailwind CSS

## Global Constraints

- Next.js 16.2.10, React 19.2.4, AI SDK v7.0.20
- TypeScript strict mode, no `any` types
- Tests: Vitest 4.1.10
- Lint: ESLint (next lint)
- Type check: `npx tsc --noEmit`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/types/index.ts` | Modify | Add `ImageResult` type, update `PlayerCardData`, `TeamCardData`, `ContextPayload` |
| `src/lib/services/ImageService.ts` | Rewrite | `searchImages()` with SerpAPI + Wikimedia fallback + in-memory cache |
| `src/__tests__/image-service.test.ts` | Create | Unit tests for ImageService (providers, cache, fallback) |
| `src/lib/card-stream.ts` | Modify | Use `context.images` instead of `context.imageUrl` |
| `src/app/api/chat/route.ts` | Modify | Call `searchImages(query, 3)` instead of `getPlayerImage`/`getTeamImage` |
| `src/components/ImageBentoGrid.tsx` | Create | Reusable bento grid component (1 large + 2 small) |
| `src/components/PlayerCard.tsx` | Modify | Accept `images: string[]`, render via `ImageBentoGrid` |
| `src/components/TeamCard.tsx` | Modify | Accept `images: string[]`, render via `ImageBentoGrid` |
| `.env.local` | Modify | Add `SERPAPI_KEY` |

---

### Task 1: Update Types

**Files:**
- Modify: `src/lib/types/index.ts:57-100`

**Interfaces:**
- Produces: `ImageResult` type, updated `PlayerCardData.images`, `TeamCardData.images`, `ContextPayload.images`

- [ ] **Step 1: Add ImageResult type and update existing interfaces**

Open `src/lib/types/index.ts` and make these changes:

Add after the `Country` interface (after line 28):

```ts
export interface ImageResult {
  url: string
  thumbnail?: string
  source: 'serpapi' | 'wikimedia'
}
```

Update `PlayerCardData` (line 57-60) — change `imageUrl?: string` to `images: string[]`:

```ts
export interface PlayerCardData {
  player: Player
  images: string[]
}
```

Update `TeamCardData` (line 62-65) — change `imageUrl?: string` to `images: string[]`:

```ts
export interface TeamCardData {
  team: NationalTeam
  images: string[]
}
```

Update `ContextPayload` (line 91-100) — change `imageUrl?: string` to `images?: string[]`:

```ts
export interface ContextPayload {
  intent: IntentResult
  player?: Player
  team?: NationalTeam
  country?: Country
  trivia?: TriviaItem
  images?: string[]
  quizData?: QuizData
  quizResult?: QuizResult
}
```

- [ ] **Step 2: Fix type errors from changed interfaces**

The following files reference `imageUrl` and will need quick fixes (we'll do them fully in later tasks, but for now just fix compile errors):

In `src/lib/card-stream.ts` — change `imageUrl: context.imageUrl` to `images: context.images ?? []` on lines 16 and 23:

```ts
if (context.player) {
  parts.push({
    type: "data-playerCard",
    data: { player: context.player, images: context.images ?? [] },
  })
}

if (context.team) {
  parts.push({
    type: "data-teamCard",
    data: { team: context.team, images: context.images ?? [] },
  })
}
```

In `src/app/api/chat/route.ts` — remove `getPlayerImage`/`getTeamImage` imports and `context.imageUrl` assignments temporarily. Replace with `context.images = []` as placeholder:

Remove these imports (lines 7):
```ts
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService";
```

Replace `context.imageUrl = (await getPlayerImage(...)) ?? undefined;` with:
```ts
context.images = [];
```

Replace `context.imageUrl = (await getTeamImage(...)) ?? undefined;` with:
```ts
context.images = [];
```

- [ ] **Step 3: Run typecheck to verify**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/index.ts src/lib/card-stream.ts src/app/api/chat/route.ts
git commit -m "refactor: update types from singular imageUrl to images array"
```

---

### Task 2: Rewrite ImageService with SerpAPI + Fallback + Cache

**Files:**
- Rewrite: `src/lib/services/ImageService.ts`

**Interfaces:**
- Produces: `searchImages(query: string, limit?: number): Promise<ImageResult[]>`

- [ ] **Step 1: Write the ImageService tests first**

Create `src/__tests__/image-service.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { searchImages } from "@/lib/services/ImageService"

describe("searchImages", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("should return images from SerpAPI when available", async () => {
    const mockSerpResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg", title: "Ronaldo" },
        { original: "https://example.com/img2.jpg", thumbnail: "https://example.com/thumb2.jpg", title: "Ronaldo Fenomeno" },
        { original: "https://example.com/img3.jpg", thumbnail: "https://example.com/thumb3.jpg", title: "Ronaldo Brazil" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSerpResponse),
    }))

    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results).toHaveLength(3)
    expect(results[0].url).toBe("https://example.com/img1.jpg")
    expect(results[0].thumbnail).toBe("https://example.com/thumb1.jpg")
    expect(results[0].source).toBe("serpapi")
  })

  it("should fallback to Wikimedia when SerpAPI fails", async () => {
    const mockWikimediaResponse = {
      query: {
        pages: {
          "123": {
            title: "Ronaldo",
            thumbnail: { source: "https://upload.wikimedia.org/thumb1.jpg" },
          },
          "456": {
            title: "Ronaldo Fenomeno",
            thumbnail: { source: "https://upload.wikimedia.org/thumb2.jpg" },
          },
        },
      },
    }

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: false })  // SerpAPI fails
      .mockResolvedValueOnce({               // Wikimedia succeeds
        ok: true,
        json: () => Promise.resolve(mockWikimediaResponse),
      })
    )

    const results = await searchImages("Ronaldo Fenomeno", 3)

    expect(results).toHaveLength(2)
    expect(results[0].source).toBe("wikimedia")
    expect(results[0].url).toBe("https://upload.wikimedia.org/thumb1.jpg")
  })

  it("should return empty array when both providers fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    const results = await searchImages("nonexistent", 3)

    expect(results).toEqual([])
  })

  it("should cache results and return cached on second call", async () => {
    const mockResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg" },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const first = await searchImages("test query", 3)
    const second = await searchImages("test query", 3)

    expect(fetchMock).toHaveBeenCalledTimes(1) // Only one API call
    expect(first).toEqual(second)
  })

  it("should skip SerpAPI when SERPAPI_KEY is not set", async () => {
    const original = process.env.SERPAPI_KEY
    delete process.env.SERPAPI_KEY

    const mockWikimediaResponse = {
      query: {
        pages: {
          "123": { thumbnail: { source: "https://upload.wikimedia.org/thumb.jpg" } },
        },
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWikimediaResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const results = await searchImages("Ronaldo", 3)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(results[0].source).toBe("wikimedia")

    process.env.SERPAPI_KEY = original
  })

  it("should limit results to specified limit", async () => {
    const mockSerpResponse = {
      images_results: [
        { original: "https://example.com/img1.jpg", thumbnail: "https://example.com/thumb1.jpg" },
        { original: "https://example.com/img2.jpg", thumbnail: "https://example.com/thumb2.jpg" },
        { original: "https://example.com/img3.jpg", thumbnail: "https://example.com/thumb3.jpg" },
        { original: "https://example.com/img4.jpg", thumbnail: "https://example.com/thumb4.jpg" },
      ],
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSerpResponse),
    }))

    const results = await searchImages("test", 2)

    expect(results).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/image-service.test.ts`
Expected: FAIL — module not found or export mismatch

- [ ] **Step 3: Implement ImageService**

Rewrite `src/lib/services/ImageService.ts`:

```ts
const WIKIMEDIA_BASE = "https://en.wikipedia.org/w/api.php"
const SERPAPI_BASE = "https://serpapi.com/search.json"
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  data: ImageResult[]
  expiry: number
}

const cache = new Map<string, CacheEntry>()

function getCacheKey(query: string, limit: number): string {
  return `${query.toLowerCase().trim()}:${limit}`
}

function getFromCache(key: string): ImageResult[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: ImageResult[]): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL })
}

async function searchSerpAPI(query: string, limit: number): Promise<ImageResult[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) return []

  try {
    const url = `${SERPAPI_BASE}?engine=google_images&q=${encodeURIComponent(query)}&api_key=${apiKey}&safe=active&hl=pt-br`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return []

    const data = await res.json()
    const results = (data.images_results ?? [])
      .slice(0, limit)
      .map((img: { original: string; thumbnail?: string; title?: string }) => ({
        url: img.original,
        thumbnail: img.thumbnail,
        source: "serpapi" as const,
      }))

    return results
  } catch {
    return []
  }
}

async function searchWikimedia(query: string, limit: number): Promise<ImageResult[]> {
  try {
    const url = `${WIKIMEDIA_BASE}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return []

    const results: ImageResult[] = Object.values(pages as Record<string, { thumbnail?: { source?: string } }>)
      .filter((p): p is { thumbnail: { source: string } } => !!p.thumbnail?.source)
      .map((p) => ({
        url: p.thumbnail.source,
        source: "wikimedia" as const,
      }))

    return results
  } catch {
    return []
  }
}

export async function searchImages(query: string, limit: number = 3): Promise<ImageResult[]> {
  const key = getCacheKey(query, limit)
  const cached = getFromCache(key)
  if (cached) return cached

  const serpResults = await searchSerpAPI(query, limit)
  if (serpResults.length > 0) {
    setCache(key, serpResults)
    return serpResults
  }

  const wikiResults = await searchWikimedia(query, limit)
  setCache(key, wikiResults)
  return wikiResults
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/image-service.test.ts`
Expected: PASS (6/6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/ImageService.ts src/__tests__/image-service.test.ts
git commit -m "feat: rewrite ImageService with SerpAPI + Wikimedia fallback + cache"
```

---

### Task 3: Update route.ts to use searchImages

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `searchImages(query, 3)` from ImageService
- Produces: `context.images: string[]`

- [ ] **Step 1: Update imports**

In `src/app/api/chat/route.ts`, replace the ImageService import:

```ts
// Remove:
import { getPlayerImage, getTeamImage } from "@/lib/services/ImageService";

// Add:
import { searchImages } from "@/lib/services/ImageService";
```

- [ ] **Step 2: Update player case**

Replace lines 64-66 in the player case:

```ts
// Remove:
context.imageUrl =
  (await getPlayerImage(player.name, player.nationalTeamName)) ??
  undefined;

// Add:
const playerImages = await searchImages(
  `${player.name} ${player.nationalTeamName} football`,
  3
);
context.images = playerImages.map((img) => img.url);
```

- [ ] **Step 3: Update team case**

Replace line 78 in the team case:

```ts
// Remove:
context.imageUrl = (await getTeamImage(team.name)) ?? undefined;

// Add:
const teamImages = await searchImages(
  `${team.name} national football team`,
  3
);
context.images = teamImages.map((img) => img.url);
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: route uses searchImages for multi-image search"
```

---

### Task 4: Create ImageBentoGrid Component

**Files:**
- Create: `src/components/ImageBentoGrid.tsx`

**Interfaces:**
- Consumes: `images: string[]`
- Produces: `<ImageBentoGrid images={string[]} />` React component

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface Props {
  images: string[]
  alt?: string
  className?: string
}

export function ImageBentoGrid({ images, alt, className }: Props) {
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  const visibleImages = images.filter((_, i) => !failedIndices.has(i))

  if (visibleImages.length === 0) return null

  function handleError(index: number) {
    setFailedIndices((prev) => new Set(prev).add(index))
  }

  if (visibleImages.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-t-lg", className)}>
        <img
          src={visibleImages[0]}
          alt={alt ?? ""}
          className="h-auto w-full object-cover"
          onError={() => handleError(images.indexOf(visibleImages[0]))}
        />
      </div>
    )
  }

  const mainImage = visibleImages[0]
  const thumbs = visibleImages.slice(1, 3)
  const mainIndex = images.indexOf(mainImage)

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-t-lg", className)}>
      <div className="relative w-full">
        <img
          src={mainImage}
          alt={alt ?? ""}
          className="h-auto w-full object-cover"
          style={{ aspectRatio: "16/9" }}
          onError={() => handleError(mainIndex)}
        />
      </div>
      {thumbs.length > 0 && (
        <div className="flex w-full">
          {thumbs.map((thumb) => {
            const thumbIndex = images.indexOf(thumb)
            return (
              <div key={thumbIndex} className="relative w-1/2">
                <img
                  src={thumb}
                  alt={alt ?? ""}
                  className="h-auto w-full object-cover"
                  style={{ aspectRatio: "1/1" }}
                  onError={() => handleError(thumbIndex)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageBentoGrid.tsx
git commit -m "feat: add ImageBentoGrid component with graceful degradation"
```

---

### Task 5: Update PlayerCard to Use ImageBentoGrid

**Files:**
- Modify: `src/components/PlayerCard.tsx`

**Interfaces:**
- Consumes: `images: string[]` from `PlayerCardData`

- [ ] **Step 1: Update PlayerCard**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageBentoGrid } from "@/components/ImageBentoGrid"
import type { PlayerCardData } from "@/lib/types"

interface Props {
  data: PlayerCardData
}

export function PlayerCard({ data }: Props) {
  const { player, images } = data

  const cupsPlayedText =
    Array.isArray(player.cupsPlayed) && player.cupsPlayed.length > 0
      ? player.cupsPlayed.join(", ")
      : "—"

  const goalsText =
    player.totalGoalsInWorldCups !== undefined
      ? player.totalGoalsInWorldCups
      : null

  const matchesText =
    player.totalMatchesInWorldCups !== undefined
      ? player.totalMatchesInWorldCups
      : null

  return (
    <Card className="w-full max-w-sm">
      {images.length > 0 && (
        <ImageBentoGrid images={images} alt={player.name} />
      )}
      <CardHeader>
        <CardTitle className="text-lg">{player.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Seleção</span>
          <span className="font-medium">{player.nationalTeamName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Posição</span>
          <span className="font-medium">{player.position}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Copas disputadas</span>
          <span className="font-medium">{cupsPlayedText}</span>
        </div>
        {goalsText !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gols em Copas</span>
            <span className="font-medium">{goalsText}</span>
          </div>
        )}
        {matchesText !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jogos em Copas</span>
            <span className="font-medium">{matchesText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/PlayerCard.tsx
git commit -m "feat: PlayerCard uses ImageBentoGrid with images array"
```

---

### Task 6: Update TeamCard to Use ImageBentoGrid

**Files:**
- Modify: `src/components/TeamCard.tsx`

**Interfaces:**
- Consumes: `images: string[]` from `TeamCardData`

- [ ] **Step 1: Update TeamCard**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageBentoGrid } from "@/components/ImageBentoGrid"
import type { TeamCardData } from "@/lib/types"

interface Props {
  data: TeamCardData
}

export function TeamCard({ data }: Props) {
  const { team, images } = data

  const cupsCount =
    Array.isArray(team.cupsParticipated) ? team.cupsParticipated.length : 0

  return (
    <Card className="w-full max-w-sm">
      {images.length > 0 && (
        <ImageBentoGrid images={images} alt={team.name} />
      )}
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Participações em Copas</span>
          <span className="font-medium">{cupsCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Melhor resultado</span>
          <span className="font-medium">{team.bestResult || "—"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/TeamCard.tsx
git commit -m "feat: TeamCard uses ImageBentoGrid with images array"
```

---

### Task 7: Add SERPAPI_KEY to .env.local

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add the key**

Append to `.env.local`:

```
SERPAPI_KEY=<user's API key>
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add SERPAPI_KEY to env config"
```

---

### Task 8: Run Full Verification

**Files:** None (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: All tests**

Run: `npx vitest run`
Expected: PASS (all tests including new image-service tests)

- [ ] **Step 3: Lint**

Run: `npx eslint src/lib/services/ImageService.ts src/lib/types/index.ts src/lib/card-stream.ts src/app/api/chat/route.ts src/components/ImageBentoGrid.tsx src/components/PlayerCard.tsx src/components/TeamCard.tsx`
Expected: PASS (no errors)

- [ ] **Step 4: Manual test**

1. Set `MOCK_AI=false` in `.env.local`
2. Run `npm run dev`
3. Open browser, type "Ronaldo Fenômeno"
4. Verify: card shows 3 images in bento grid (1 large + 2 small)
5. Type "Brasil"
6. Verify: team card shows images
7. Verify: country flag still works on CountryCard
