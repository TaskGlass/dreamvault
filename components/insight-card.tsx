import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface InsightCardProps {
  title: string
  description: string
  icon: LucideIcon
}

export function InsightCard({ title, description, icon: Icon }: InsightCardProps) {
  return (
    <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 h-full">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-bl-full"></div>
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Icon className="h-5 w-5 text-purple-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
