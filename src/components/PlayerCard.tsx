import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerCardData } from "@/lib/types"

interface Props {
  data: PlayerCardData
}

export function PlayerCard({ data }: Props) {
  const { player, imageUrl } = data

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
      {imageUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={player.name}
            className="h-full w-full object-cover"
          />
        </div>
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
