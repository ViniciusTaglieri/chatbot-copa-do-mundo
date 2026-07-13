import type { Country } from "../types"

const REST_COUNTRIES_BASE = "https://restcountries.com/v3.1"

export async function getCountryByName(name: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `${REST_COUNTRIES_BASE}/name/${encodeURIComponent(name)}?fields=name,cca2,capital,region,population,languages,flags`
    )
    if (!res.ok) return null

    const data = await res.json()
    if (!data || data.length === 0) return null

    const c = data[0]
    return {
      code: c.cca2?.toLowerCase() || "",
      name: c.name?.common || name,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population,
      languages: c.languages ? Object.values(c.languages) as string[] : undefined,
      flagUrl: c.flags?.png || c.flags?.svg,
    }
  } catch {
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
  } catch {
    return null
  }
}

export async function getRandomCountryFact(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${process.env.RAPIDAPI_HOST}/fact.php?lang=pt`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!,
        },
      }
    )
    if (!res.ok) return null

    const data = await res.json()
    return data?.fact || data?.text || data?.description || null
  } catch {
    return null
  }
}
