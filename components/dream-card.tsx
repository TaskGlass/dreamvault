import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Dream {
  id: string
  title: string
  date: string
  summary: string
  mood: string
  tags: string[]
}

interface DreamCardProps {
  dream: Dream
}

export function DreamCard({ dream }: DreamCardProps) {
  // Function to get mood color
  const getMoodColor = (mood: string) => {
    const moodMap: Record<string, string> = {
      Joyful: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      Happy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      Peaceful: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      Calm: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      Curious: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
      Excited: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
      Anxious: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
      Scared: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      Fearful: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      Sad: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
      Confused: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
    }

    return moodMap[mood] || "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
  }

  return (
    <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base md:text-lg line-clamp-1">{dream.title}</CardTitle>
          <Badge variant="outline" className={getMoodColor(dream.mood)}>
            {dream.mood}
          </Badge>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          {dream.date}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 mt-2">{dream.summary}</p>
        {dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 md:mt-4">
            {dream.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 h-5">
                {tag}
              </Badge>
            ))}
            {dream.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                +{dream.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button variant="ghost" size="sm" className="ml-0 group" asChild>
          <Link href={`/dashboard/journal/${dream.id}`} className="flex items-center gap-1 text-xs md:text-sm">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
