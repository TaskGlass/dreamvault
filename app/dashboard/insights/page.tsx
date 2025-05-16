"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InsightCard } from "@/components/insight-card"
import { Brain, Sparkles, BarChart3, Clock, Tag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getDreamsByUserId } from "@/lib/dream-service"
import type { Dream } from "@/lib/dream-service"

export default function InsightsPage() {
  const { user } = useAuth()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDreams() {
      if (!user) return

      try {
        const userDreams = await getDreamsByUserId(user.id)
        setDreams(userDreams)
      } catch (error) {
        console.error("Error fetching dreams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDreams()
  }, [user])

  // Calculate theme frequencies
  const themeCounts: Record<string, number> = {}
  dreams.forEach((dream) => {
    if (dream.tags) {
      dream.tags.forEach((tag) => {
        themeCounts[tag] = (themeCounts[tag] || 0) + 1
      })
    }
  })

  // Sort themes by frequency
  const sortedThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate emotion frequencies
  const emotionCounts: Record<string, number> = {}
  dreams.forEach((dream) => {
    if (dream.mood) {
      emotionCounts[dream.mood] = (emotionCounts[dream.mood] || 0) + 1
    }
  })

  // Sort emotions by frequency
  const sortedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate day of week frequencies
  const dayOfWeekCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  }

  dreams.forEach((dream) => {
    const date = new Date(dream.created_at)
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading insights...</div>
      </div>
    )
  }

  if (dreams.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dream Insights</h1>
          <p className="text-muted-foreground mt-2">Record dreams to see patterns and insights</p>
        </div>

        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 p-8 text-center">
          <CardContent className="pt-6">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">No Dreams Recorded Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start recording your dreams to unlock powerful insights about your subconscious mind.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-8 sm:pb-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Insights</h1>
        <p className="text-muted-foreground mt-1">Discover patterns and insights from your dreams</p>
      </div>

      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="themes">Themes & Symbols</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-6">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-500" />
                Common Dream Themes
              </CardTitle>
              <CardDescription>Recurring themes in your dream journal</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedThemes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedThemes.slice(0, 2).map(([theme, count]) => (
                    <div key={theme} className="relative h-40 rounded-lg overflow-hidden border border-purple-300/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="text-4xl font-bold">{Math.round((count / dreams.length) * 100)}%</div>
                        <div className="text-lg">{theme}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Appears in {count} of {dreams.length} dreams
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Add tags to your dreams to see theme analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedThemes.slice(2, 4).map(([theme, count]) => (
              <InsightCard
                key={theme}
                title={`Symbol: ${theme}`}
                description={`${theme} appears in ${count} of your dreams (${Math.round((count / dreams.length) * 100)}%), suggesting its significance in your subconscious.`}
                icon={Brain}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emotions" className="space-y-6">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Emotional Landscape
              </CardTitle>
              <CardDescription>Distribution of emotions in your dreams</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedEmotions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortedEmotions.map(([emotion, count]) => (
                    <div
                      key={emotion}
                      className="flex flex-col items-center p-4 border border-purple-300/20 rounded-lg"
                    >
                      <div className="text-2xl font-bold mb-1">{Math.round((count / dreams.length) * 100)}%</div>
                      <div className="text-lg mb-1">{emotion}</div>
                      <div className="text-xs text-muted-foreground">
                        {count} of {dreams.length} dreams
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Add mood information to your dreams to see emotional analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedEmotions.length > 0 && (
              <InsightCard
                title={`Primary Emotion: ${sortedEmotions[0][0]}`}
                description={`${sortedEmotions[0][0]} is your most common dream emotion (${Math.round((sortedEmotions[0][1] / dreams.length) * 100)}%), suggesting its significance in your current life.`}
                icon={Sparkles}
              />
            )}
            {sortedEmotions.length > 1 && (
              <InsightCard
                title="Emotional Trend"
                description={`Your dreams show ${sortedEmotions[0][0]} and ${sortedEmotions[1][0]} as your dominant emotional states.`}
                icon={Sparkles}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Temporal Patterns
              </CardTitle>
              <CardDescription>When your most significant dreams occur</CardDescription>
            </CardHeader>
            <CardContent>
              {dreams.length > 2 ? (
                <div className="grid grid-cols-7 gap-2 h-64">
                  {Object.entries(dayOfWeekCounts).map(([day, count]) => {
                    const percentage = dreams.length > 0 ? (count / dreams.length) * 100 : 0
                    const height = percentage > 0 ? `${Math.max(percentage * 2, 10)}%` : "10%"

                    return (
                      <div key={day} className="flex flex-col items-center justify-end">
                        <div className="w-full bg-purple-500/20 rounded-t-md" style={{ height }}></div>
                        <div className="text-xs mt-2 text-muted-foreground">{day.substring(0, 3)}</div>
                        <div className="text-xs font-medium">{count}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Record more dreams to see temporal pattern analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(dayOfWeekCounts).length > 0 && (
              <InsightCard
                title="Weekly Pattern"
                description={`You tend to record more dreams on ${
                  Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0][0]
                } than any other day of the week.`}
                icon={BarChart3}
              />
            )}
            {dreams.length > 0 && (
              <InsightCard
                title="Dream Frequency"
                description={`You record an average of ${(dreams.length / Math.max(1, Math.ceil(dreams.length / 7))).toFixed(1)} dreams per week.`}
                icon={BarChart3}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
