import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"
import type { TriviaItem } from "@/lib/types"

interface Props {
  data: TriviaItem
}

export function TriviaCard({ data }: Props) {
  return (
    <Card className="w-full max-w-sm border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">{data.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </CardContent>
    </Card>
  )
}
