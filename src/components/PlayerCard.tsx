import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerCardData } from "@/lib/types"

interface Props {
  data: PlayerCardData
}

export function PlayerCard({ data }: Props) {
  const { player, imageUrl } = data

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
          <span className="font-medium">{player.cupsPlayed.join(", ") || "—"}</span>
        </div>
        {player.totalGoalsInWorldCups !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gols em Copas</span>
            <span className="font-medium">{player.totalGoalsInWorldCups}</span>
          </div>
        )}
        {player.totalMatchesInWorldCups !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jogos em Copas</span>
            <span className="font-medium">{player.totalMatchesInWorldCups}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
