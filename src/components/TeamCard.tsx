import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TeamCardData } from "@/lib/types"

interface Props {
  data: TeamCardData
}

export function TeamCard({ data }: Props) {
  const { team, imageUrl } = data

  return (
    <Card className="w-full max-w-sm">
      {imageUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={team.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Participações em Copas</span>
          <span className="font-medium">{team.cupsParticipated.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Melhor resultado</span>
          <span className="font-medium">{team.bestResult || "—"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
