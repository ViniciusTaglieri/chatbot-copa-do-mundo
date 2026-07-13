const WIKIMEDIA_BASE = "https://en.wikipedia.org/w/api.php"

async function searchWikimedia(query: string): Promise<string | null> {
  try {
    const url = `${WIKIMEDIA_BASE}?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    const page = Object.values(pages as Record<string, { thumbnail?: { source?: string } }>).find(
      (p) => p.thumbnail?.source
    )
    return page?.thumbnail?.source || null
  } catch {
    return null
  }
}

export async function getPlayerImage(playerName: string, teamName?: string): Promise<string | null> {
  const terms = [playerName]
  if (teamName) terms.push(teamName)
  terms.push("footballer")
  return searchWikimedia(terms.join(" "))
}

export async function getTeamImage(teamName: string): Promise<string | null> {
  return searchWikimedia(`${teamName} national football team`)
}
