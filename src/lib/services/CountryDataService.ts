import type { Country } from "../types"

const REST_COUNTRIES_BASE = "https://restcountries.com/v3.1"

export async function getCountryByName(name: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `${REST_COUNTRIES_BASE}/name/${encodeURIComponent(name)}?fields=name,cca2,capital,region,population,languages,flags`
    )
    if (!res.ok) return null

    const data: unknown = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const c = data[0]
    if (!c || typeof c !== "object") return null

    return {
      code: c.cca2?.toLowerCase() || "",
      name: c.name?.common || name,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population,
      languages: c.languages ? Object.values(c.languages) as string[] : undefined,
      flagUrl: c.flags?.png || c.flags?.svg,
    }
  } catch (error) {
    console.error("[CountryDataService] getCountryByName error:", error)
    return null
  }
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `${REST_COUNTRIES_BASE}/alpha/${code.toLowerCase()}?fields=name,cca2,capital,region,population,languages,flags`
    )
    if (!res.ok) return null

    const c = await res.json()
    return {
      code: c.cca2?.toLowerCase() || code,
      name: c.name?.common || code,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population,
      languages: c.languages ? Object.values(c.languages) as string[] : undefined,
      flagUrl: c.flags?.png || c.flags?.svg,
    }
  } catch (error) {
    console.error("[CountryDataService] getCountryByCode error:", error)
    return null
  }
}

export async function getRandomCountryFact(): Promise<string | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  const host = process.env.RAPIDAPI_HOST
  if (!apiKey || !host) {
    console.warn("[CountryDataService] RAPIDAPI_KEY or RAPIDAPI_HOST not configured")
    return null
  }

  try {
    const res = await fetch(
      `https://${host}/fact.php?lang=pt`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": host,
        },
      }
    )
    if (!res.ok) return null

    const data = await res.json()
    return data?.fact || data?.text || data?.description || null
  } catch (error) {
    console.error("[CountryDataService] getRandomCountryFact error:", error)
    return null
  }
}
