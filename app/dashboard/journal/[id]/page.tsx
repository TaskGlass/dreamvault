"use client"

import { CardFooter } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Brain, Sparkles, Trash2, Share2, Loader2, PlusCircle, Star } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { getDreamById, deleteDream, shareDreamContent } from "@/lib/dream-service"
import type { Dream } from "@/lib/dream-service"

export default function DreamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [dream, setDream] = useState<Dream | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [sharingAffirmation, setSharingAffirmation] = useState(false)
  const [horoscope, setHoroscope] = useState<any>(null)
  const [zodiacSign, setZodiacSign] = useState<string>("")
  const [loadingHoroscope, setLoadingHoroscope] = useState(false)

  useEffect(() => {
    async function fetchDream() {
      if (!user || !params.id) return

      try {
        const dreamData = await getDreamById(params.id as string)
        setDream(dreamData)
      } catch (error) {
        console.error("Error fetching dream:", error)
        toast({
          title: "Error",
          description: "Failed to load dream details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDream()
  }, [user, params.id, toast])

  const handleDelete = async () => {
    if (!dream) return

    if (deleteConfirm) {
      try {
        const { success, error } = await deleteDream(dream.id)

        if (!success) {
          throw error
        }

        toast({
          title: "Dream deleted",
          description: "Your dream has been permanently deleted.",
        })

        router.push("/dashboard/journal")
      } catch (error) {
        console.error("Error deleting dream:", error)
        toast({
          title: "Error",
          description: "Failed to delete dream. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      setDeleteConfirm(true)
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeleteConfirm(false), 3000)
    }
  }

  const handleShareAffirmation = async () => {
    if (!dream || !dream.interpretation) return

    const interpretation = dream.interpretation as any
    if (!interpretation.affirmation) return

    setSharingAffirmation(true)
    try {
      const { shareUrl, error } = await shareDreamContent(
        "affirmation",
        interpretation.affirmation,
        dream.id,
        "Dream Affirmation",
      )

      if (error) throw error

      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Affirmation shared",
          description: "Share link copied to clipboard!",
        })
      }
    } catch (error) {
      console.error("Error sharing affirmation:", error)
      toast({
        title: "Error",
        description: "Failed to share affirmation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSharingAffirmation(false)
    }
  }

  const generateHoroscope = async () => {
    if (!dream || !dream.interpretation || !user) return

    setLoadingHoroscope(true)
    try {
      const response = await fetch("/api/generate-horoscope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dreamText: dream.content,
          interpretation: dream.interpretation,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate horoscope")
      }

      const data = await response.json()
      setHoroscope(data.horoscope)
      setZodiacSign(data.zodiacSign)
    } catch (error) {
      console.error("Error generating horoscope:", error)
      toast({
        title: "Error",
        description: "Failed to generate horoscope. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingHoroscope(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="animate-pulse text-muted-foreground">Loading dream details...</div>
      </div>
    )
  }

  if (!dream) {
    return (
      <div className="text-center py-12 w-full">
        <h2 className="text-2xl font-bold mb-4">Dream Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The dream you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/dashboard/journal">Back to Journal</Link>
        </Button>
      </div>
    )
  }

  const interpretation = dream.interpretation as any
  const formattedDate = new Date(dream.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="w-full space-y-6 pb-8 sm:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard/journal">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-left">{dream.title}</h1>
        </div>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          className={deleteConfirm ? "animate-pulse" : ""}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-start text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-2" />
        {formattedDate}
        {dream.mood && (
          <Badge variant="outline" className="ml-4 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
            {dream.mood}
          </Badge>
        )}
      </div>

      <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 w-full">
        <CardHeader>
          <CardTitle className="text-left">Dream Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-left">{dream.content}</p>
          {dream.tags && dream.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 justify-start">
              {dream.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {interpretation && (
        <Tabs defaultValue="interpretation" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="interpretation" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Interpretation</span>
            </TabsTrigger>
            <TabsTrigger value="affirmation" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Affirmation</span>
            </TabsTrigger>
            <TabsTrigger value="horoscope" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Horoscope</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interpretation">
            <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-start">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Dream Interpretation
                </CardTitle>
                <CardDescription className="text-left">
                  AI-powered analysis of your dream
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-left">Summary</h3>
                  <p className="text-muted-foreground text-left">{interpretation.summary}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-left">Emotions</h3>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {interpretation.emotions.map((emotion: string) => (
                      <Badge key={emotion} variant="secondary">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-left">Key Symbols</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interpretation.symbols.map((symbol: { name: string; meaning: string }) => (
                      <div key={symbol.name} className="border-l-2 border-purple-500 pl-3">
                        <h4 className="font-medium text-left">{symbol.name}</h4>
                        <p className="text-sm text-muted-foreground text-left">{symbol.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-left">Insights</h3>
                  <p className="text-muted-foreground text-left">{interpretation.insights}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-left">Recommendations</h3>
                  <p className="text-muted-foreground text-left">{interpretation.recommendations}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affirmation">
            <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-start">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Dream Affirmation
                </CardTitle>
                <CardDescription className="text-left">
                  Personalized affirmation based on your dream
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start justify-center py-12">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
                  <div className="relative rounded-lg p-8 border border-purple-300/20 backdrop-blur-sm bg-background/80">
                    <p className="text-xl font-medium italic text-left">"{interpretation.affirmation}"</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-2 border-t border-border/50 p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={handleShareAffirmation}
                  disabled={sharingAffirmation}
                >
                  {sharingAffirmation ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{sharingAffirmation ? "Sharing..." : "Share"}</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="horoscope">
            <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-start">
                  <Star className="h-5 w-5 text-purple-500" />
                  Cosmic Dream Connection
                </CardTitle>
                <CardDescription className="text-left">
                  How your dream relates to your daily horoscope
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingHoroscope ? (
                  <div className="flex flex-col items-start justify-center py-12">
                    <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                    <p className="text-muted-foreground">Consulting the stars...</p>
                  </div>
                ) : horoscope ? (
                  <>
                    <div className="flex items-start justify-start mb-6">
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
                        <div className="relative rounded-full p-6 border border-purple-300/20 backdrop-blur-sm bg-background/80">
                          <Star className="h-12 w-12 text-yellow-400" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h3 className="text-2xl font-bold">{zodiacSign}</h3>
                        <p className="text-muted-foreground">Your Zodiac Sign</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 text-sm text-muted-foreground">TODAY'S HOROSCOPE</h3>
                      <p className="text-lg text-left">{horoscope.dailyHoroscope}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 text-sm text-muted-foreground">DREAM & STARS CONNECTION</h3>
                      <p className="text-muted-foreground text-left">{horoscope.dreamConnection}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 text-sm text-muted-foreground">COSMIC INSIGHT</h3>
                      <p className="text-muted-foreground text-left">{horoscope.cosmicInsight}</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-500/30 to-indigo-500/30 opacity-75 blur"></div>
                      <div className="relative rounded-lg p-6 border border-purple-300/20 backdrop-blur-sm bg-background/80">
                        <h3 className="font-medium mb-2 text-left">ASTROLOGICAL ADVICE</h3>
                        <p className="text-left italic">{horoscope.advice}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-start justify-center py-12">
                    <div className="bg-muted/30 rounded-lg p-8 mb-6 text-left">
                      <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No horoscope has been generated for this dream yet.</p>
                      <Button onClick={generateHoroscope}>Generate Horoscope</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
