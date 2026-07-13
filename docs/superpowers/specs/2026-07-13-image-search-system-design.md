# Image Search System — Design Spec

## Summary

Replace the broken single-image Wikimedia lookup with a robust multi-image search system using SerpAPI (Google Images) as primary provider and Wikimedia as fallback. Returns up to 3 images displayed in a bento grid layout (1 large + 2 small thumbnails).

## Problem

- Current `ImageService.ts` uses Wikipedia's `titles` parameter (exact title lookup), which fails for queries like "Ronaldo Fenômeno Brasil football" — no article has that exact title
- Even with the `generator=search` fix, Wikipedia thumbnails are low-quality article images
- Cards render with no images because `imageUrl` is always `undefined`
- System only supports 1 image per card

## Goals

1. Return up to 3 relevant images for any player/team/country query
2. Use SerpAPI (Google Images) as primary source for high-quality results
3. Fall back to Wikimedia if SerpAPI fails or returns insufficient results
4. Cache results to stay within SerpAPI free tier (100 req/month)
5. Display images in bento grid layout: 1 large + 2 small thumbnails
6. Degrade gracefully: 1 or 2 images if 3 not available, no images if both providers fail

## Non-Goals

- Image caching across server restarts (in-memory cache is sufficient)
- Image upload or storage (read-only from external APIs)
- Image editing or transformation
- Support for more than 3 images

## Architecture

### Providers

**SerpAPI (Primary)**
- Endpoint: `https://serpapi.com/search.json?engine=google_images&q={query}&api_key={key}`
- Params: `tbs=isz:m` (medium size), `safe=active`
- Response: `images_results[]` with `original`, `thumbnail`, `title`, `source`
- Free tier: 100 searches/month

**Wikimedia (Fallback)**
- Endpoint: `https://en.wikipedia.org/w/api.php`
- Params: `action=query&generator=search&gsrsearch={query}&gsrlimit=3&prop=pageimages&pithumbsize=400`
- Response: `query.pages[id].thumbnail.source`
- Free, unlimited

### Cache

- In-memory `Map<string, CacheEntry>` where `CacheEntry = { data: ImageResult[], expiry: number }`
- TTL: 1 hour (3,600,000 ms)
- Key: normalized query string (lowercase, trimmed)
- Avoids duplicate API calls for same search term

### Data Flow

```
route.ts
  → searchImages(query, 3)
    → check cache → hit? return cached
    → try SerpAPI(query, 3)
      → success with ≥1 result? → cache + return
    → fallback to Wikimedia(query, 3)
      → cache + return (even if empty)
  → context.images = results.map(r => r.url)
  → buildCardDataParts(context)
    → { type: 'data-playerCard', data: { player, images: [...] } }
  → stream to frontend

ChatWindow.tsx
  → msg.parts → data-playerCard → <PlayerCard data={...} />
  → PlayerCard renders <ImageBentoGrid images={data.images} />
```

## Types

```ts
// src/lib/types/index.ts

interface ImageResult {
  url: string
  thumbnail?: string
  source: 'serpapi' | 'wikimedia'
}

// Updated — was: imageUrl?: string
interface PlayerCardData {
  player: Player
  images: string[]
}

// Updated — was: imageUrl?: string
interface TeamCardData {
  team: NationalTeam
  images: string[]
}

// Updated — was: imageUrl?: string
interface ContextPayload {
  // ...existing fields
  images?: string[]  // replaces imageUrl
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types/index.ts` | Add `ImageResult`, update `PlayerCardData`, `TeamCardData`, `ContextPayload` |
| `src/lib/services/ImageService.ts` | Full rewrite: `searchImages()` with SerpAPI + Wikimedia fallback + cache |
| `src/lib/card-stream.ts` | Use `context.images` instead of `context.imageUrl` |
| `src/app/api/chat/route.ts` | Call `searchImages(query, 3)` instead of `getPlayerImage`/`getTeamImage` |
| `src/components/PlayerCard.tsx` | Accept `images: string[]`, render bento grid |
| `src/components/TeamCard.tsx` | Accept `images: string[]`, render bento grid |
| `src/components/ImageBentoGrid.tsx` | **New** — reusable bento grid component |
| `.env.local` | Add `SERPAPI_KEY` |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| SerpAPI timeout (>5s) | Falls back to Wikimedia |
| SerpAPI error (4xx/5xx) | Falls back to Wikimedia |
| SerpAPI returns 0 results | Falls back to Wikimedia |
| Wikimedia also fails | Card renders without images (text only) |
| Individual `<img>` fails to load | `onError` hides that specific image |
| Cache hit | Returns immediately, no API call |
| `SERPAPI_KEY` missing | Skips SerpAPI, uses Wikimedia only |

## UI — Bento Grid Layout

```
┌─────────────────────────┐
│                         │
│     Imagem Grande        │  aspect-ratio: 16/9
│     (primeira)           │
│                         │
├────────────┬────────────┤
│  Mini 1    │  Mini 2    │  aspect-ratio: 1/1
│  (segunda) │  (terceira)│
└────────────┴────────────┘
```

- Container: `rounded-lg overflow-hidden`, same width as card
- Great image: `object-cover w-full h-auto`
- Small images: `object-cover w-full h-full`, equal width
- If only 1 image: just the large image (no miniatures row)
- If only 2 images: large + 1 miniature (half width)

## Testing

- Unit tests for `searchImages()` with mocked fetch
- Unit tests for cache behavior (hit, miss, expiry)
- Unit tests for fallback logic (SerpAPI fail → Wikimedia)
- Visual test: bento grid with 1, 2, and 3 images
- Integration test: end-to-end with mock mode
