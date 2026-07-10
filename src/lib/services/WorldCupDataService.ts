import type { Player, NationalTeam } from "../types"
import { getFromCache, setToCache } from "../cache"

const BASE_URL = process.env.ZAFRONIX_API_BASE_URL!
const API_KEY = process.env.ZAFRONIX_API_KEY!

async function fetchFromZafronix(endpoint: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "X-Api-Key": API_KEY,
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
    const data = await fetchFromZafronix(`/players/search?q=${encodeURIComponent(name)}`)
    if (!data || data.length === 0) return null

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
  } catch {
    return null
  }
}

export async function getTeamByName(name: string): Promise<NationalTeam | null> {
  const cacheKey = `team:${name.toLowerCase()}`
  const cached = getFromCache<NationalTeam>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFromZafronix(`/teams/search?q=${encodeURIComponent(name)}`)
    if (!data || data.length === 0) return null

    const t = data[0]
    const team: NationalTeam = {
      id: String(t.id),
      name: t.name,
      countryCode: t.country_code || t.countryCode,
      cupsParticipated: t.world_cups || t.worldCups || [],
      bestResult: t.best_result || t.bestResult,
    }

    setToCache(cacheKey, team)
    return team
  } catch {
    return null
  }
}

export async function getRandomTrivia(): Promise<{ title: string; description: string } | null> {
  try {
    const data = await fetchFromZafronix("/trivia/random")
    if (!data) return null
    return {
      title: data.title || "Curiosidade",
      description: data.description || data.fact || data.text,
    }
  } catch {
    return null
  }
}
