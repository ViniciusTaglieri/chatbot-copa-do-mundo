import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CountryCardData } from "@/lib/types"

interface Props {
  data: CountryCardData
}

export function CountryCard({ data }: Props) {
  const { country } = data

  return (
    <Card className="w-full max-w-sm">
      {country.flagUrl && (
        <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src={country.flagUrl}
            alt={`Bandeira ${country.name}`}
            className="h-full w-full object-contain p-4"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{country.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {country.capital && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital</span>
            <span className="font-medium">{country.capital}</span>
          </div>
        )}
        {country.region && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Região</span>
            <span className="font-medium">{country.region}</span>
          </div>
        )}
        {country.population && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">População</span>
            <span className="font-medium">{country.population.toLocaleString("pt-BR")}</span>
          </div>
        )}
        {country.languages && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idiomas</span>
            <span className="font-medium text-right">{country.languages.join(", ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
