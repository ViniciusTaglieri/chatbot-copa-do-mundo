import { env } from "@lib/env"
import type { Player, NationalTeam } from "@lib/types"
import { getFromCache, setToCache } from "@lib/cache"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZafronixRecord = Record<string, any>

async function fetchFromZafronix(endpoint: string): Promise<ZafronixRecord[]> {
  const { ZAFRONIX_API_BASE_URL: baseUrl, ZAFRONIX_API_KEY: apiKey } = env

  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`Zafronix API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

async function fetchFromZafronixRaw(endpoint: string): Promise<ZafronixRecord> {
  const { ZAFRONIX_API_BASE_URL: baseUrl, ZAFRONIX_API_KEY: apiKey } = env

  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`Zafronix API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function searchPlayer(name: string): Promise<Player | null> {
  const cacheKey = `player:${name.toLowerCase()}`
  const cached = getFromCache<Player>(cacheKey)
  if (cached) return cached

  try {
    const raw = await fetchFromZafronix(`/players?q=${encodeURIComponent(name)}&limit=5`)
    const data: ZafronixRecord[] = Array.isArray(raw)
      ? raw
      : (raw as unknown as { results?: ZafronixRecord[] }).results ?? []
    if (data.length === 0) return null

    const p = data[0]
    const player: Player = {
      id: String(p.id),
      name: p.name,
      countryCode: p.country_code || p.countryCode,
      nationalTeamName: p.national_team || p.nationalTeam,
      position: p.position,
      cupsPlayed: p.world_cups || p.worldCups || [],
      totalGoalsInWorldCups: p.total_goals || p.totalGoals,
      totalMatchesInWorldCups: p.total_matches || p.totalMatches,
    }

    setToCache(cacheKey, player)
    return player
  } catch (error) {
    console.error("[WorldCupDataService] searchPlayer error:", error)
    return null
  }
}

export async function getTeamByName(name: string): Promise<NationalTeam | null> {
  const cacheKey = `team:${name.toLowerCase()}`
  const cached = getFromCache<NationalTeam>(cacheKey)
  if (cached) return cached

  try {
    const searchResult = await fetchFromZafronixRaw(`/search?q=${encodeURIComponent(name)}&types=team&limit=1`)
    const results = searchResult.results as Array<{ href: string; label: string }> | undefined
    if (!results || results.length === 0) return null

    const teamHref = results[0].href
    const teamData = await fetchFromZafronixRaw(teamHref)
    if (!teamData) return null

    const appearances = (teamData.appearances || []) as Array<Record<string, unknown>>
    const bestPosition = appearances.length > 0
      ? appearances.reduce((min, a) => {
          const pos = Number(a.finalPosition)
          return pos > 0 && pos < min ? pos : min
        }, Infinity)
      : undefined

    const team: NationalTeam = {
      id: String(teamData.name || name),
      name: String(teamData.name || name),
      countryCode: String((teamData.flag as Record<string, unknown>)?.fifaCode || ""),
      cupsParticipated: appearances.map((a) => Number(a.year)).filter(Boolean),
      bestResult: bestPosition && bestPosition !== Infinity
        ? bestPosition === 1 ? "Campeão" : `${bestPosition}º lugar`
        : undefined,
    }

    setToCache(cacheKey, team)
    return team
  } catch (error) {
    console.error("[WorldCupDataService] getTeamByName error:", error)
    return null
  }
}

export async function getRandomTrivia(): Promise<{ title: string; description: string } | null> {
  try {
    const raw = await fetchFromZafronix("/trivia/random")
    const data: ZafronixRecord[] = Array.isArray(raw)
      ? raw
      : (raw as unknown as { results?: ZafronixRecord[] }).results ?? []
    if (data.length === 0) return null
    const d = data[0]
    return {
      title: d.title || "Curiosidade",
      description: d.description || d.fact || d.text,
    }
  } catch (error) {
    console.error("[WorldCupDataService] getRandomTrivia error:", error)
    return null
  }
}
