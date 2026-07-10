const WIKIMEDIA_BASE = "https://en.wikipedia.org/w/api.php"
const GOOGLE_CX = process.env.GOOGLE_CX
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

async function searchWikimedia(query: string): Promise<string | null> {
  try {
    const url = `${WIKIMEDIA_BASE}?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    const page = Object.values(pages as Record<string, any>).find(
      (p: any) => p.thumbnail?.source
    )
    return page?.thumbnail?.source || null
  } catch {
    return null
  }
}

async function searchGoogleImages(query: string): Promise<string | null> {
  if (!GOOGLE_CX || !GOOGLE_API_KEY) return null
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&rights=cc_publicdomain&num=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data?.items?.[0]?.link || null
  } catch {
    return null
  }
}

export async function getPlayerImage(playerName: string, teamName?: string): Promise<string | null> {
  const terms = [playerName]
  if (teamName) terms.push(teamName)
  terms.push("footballer")
  const query = terms.join(" ")

  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia

  return searchGoogleImages(`${playerName} ${teamName || ""} footballer`)
}

export async function getTeamImage(teamName: string): Promise<string | null> {
  const query = `${teamName} national football team`
  const wikimedia = await searchWikimedia(query)
  if (wikimedia) return wikimedia

  return searchGoogleImages(`${teamName} football team`)
}
