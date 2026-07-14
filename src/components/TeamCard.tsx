import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { ImageBentoGrid } from "@components/ImageBentoGrid"
import type { TeamCardData } from "@lib/types"

interface Props {
  data: TeamCardData
}

export function TeamCard({ data }: Props) {
  const { team, images } = data

  const cupsCount =
    Array.isArray(team.cupsParticipated) ? team.cupsParticipated.length : 0

  return (
    <Card className="w-full max-w-sm">
      {images.length > 0 && (
        <ImageBentoGrid images={images} alt={team.name} />
      )}
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Participações em Copas</span>
          <span className="font-medium">{cupsCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Melhor resultado</span>
          <span className="font-medium">{team.bestResult || "—"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
