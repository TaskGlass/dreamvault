"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Sparkles, Save, Share2, ArrowLeft, Loader2, Star, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shareDreamContent } from "@/lib/dream-service"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DreamInterpretationProps {
  interpretation: any
  dreamText: string
  onSave: () => void
  dreamId?: string
}

export function DreamInterpretation({ interpretation, dreamText, onSave, dreamId }: DreamInterpretationProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [horoscope, setHoroscope] = useState<any>(null)
  const [zodiacSign, setZodiacSign] = useState<string>("")
  const [loadingHoroscope, setLoadingHoroscope] = useState(false)
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null)
  const [sharingAffirmation, setSharingAffirmation] = useState(false)

  useEffect(() => {
    // Generate horoscope when component mounts
    if (interpretation && !horoscope && !horoscopeError && user) {
      generateHoroscope()
    }
  }, [interpretation, user])

  const handleSave = async () => {
    setSaving(true)
    await onSave()
    setSaving(false)
  }

  const generateHoroscope = async () => {
    if (!interpretation || !user) return

    setLoadingHoroscope(true)
    setHoroscopeError(null)

    try {
      console.log("Generating horoscope for user:", user.id)

      const response = await fetch("/api/generate-horoscope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dreamText,
          interpretation,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Horoscope generation failed:", data)
        throw new Error(data.message || "Failed to generate horoscope")
      }

      if (data.error) {
        throw new Error(data.message || "Error in horoscope generation")
      }

      console.log("Horoscope generated successfully:", data)
      setHoroscope(data.horoscope)
      setZodiacSign(data.zodiacSign)
    } catch (error: any) {
      console.error("Error generating horoscope:", error)
      setHoroscopeError(error.message || "Failed to generate horoscope. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to generate horoscope. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingHoroscope(false)
    }
  }

  const handleShareAffirmation = async () => {
    if (!interpretation?.affirmation) return

    setSharingAffirmation(true)
    try {
      const { shareUrl, error } = await shareDreamContent(
        "affirmation",
        interpretation.affirmation,
        dreamId,
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

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold">Dream Interpretation</h2>
          <p className="text-muted-foreground">AI-powered analysis of your dream</p>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save to Journal
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
        <CardHeader>
          <CardTitle>Your Dream</CardTitle>
          <CardDescription>The dream you described</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground">{dreamText}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="symbols" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Symbols</span>
          </TabsTrigger>
          <TabsTrigger value="horoscope" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Horoscope</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Dream Summary
              </CardTitle>
              <CardDescription>The core meaning of your dream</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-lg">{interpretation.summary}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground">EMOTIONS DETECTED</h3>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {interpretation.emotions.map((emotion: string) => (
                    <Badge key={emotion} variant="secondary" className="bg-purple-500/10 hover:bg-purple-500/20">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 bg-muted/50 flex flex-col sm:flex-row justify-between gap-2 p-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                <span className="font-medium">Dream Affirmation:</span> "{interpretation.affirmation}"
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 mx-auto sm:ml-auto sm:mx-0"
                onClick={handleShareAffirmation}
                disabled={sharingAffirmation}
              >
                {sharingAffirmation ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                <span className="sr-only sm:not-sr-only">
                  {sharingAffirmation ? "Sharing..." : "Share Affirmation"}
                </span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="symbols">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Key Symbols
              </CardTitle>
              <CardDescription>Important elements in your dream and their meanings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interpretation.symbols.map((symbol: { name: string; meaning: string }) => (
                  <Card key={symbol.name} className="border border-purple-200/10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-indigo-500/50"></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-center sm:text-left">{symbol.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center sm:text-left">{symbol.meaning}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horoscope">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Cosmic Dream Connection
              </CardTitle>
              <CardDescription>How your dream relates to your daily horoscope</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingHoroscope ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                  <p className="text-muted-foreground">Consulting the stars...</p>
                </div>
              ) : horoscopeError ? (
                <div className="py-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error generating horoscope</AlertTitle>
                    <AlertDescription>
                      {horoscopeError}
                      <div className="mt-4">
                        <Button onClick={generateHoroscope} variant="outline" size="sm">
                          Try Again
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : horoscope ? (
                <>
                  <div className="flex items-center justify-center mb-6">
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
                    <p className="text-lg">{horoscope.dailyHoroscope}</p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-sm text-muted-foreground">DREAM & STARS CONNECTION</h3>
                    <p className="text-muted-foreground">{horoscope.dreamConnection}</p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-sm text-muted-foreground">COSMIC INSIGHT</h3>
                    <p className="text-muted-foreground">{horoscope.cosmicInsight}</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-500/30 to-indigo-500/30 opacity-75 blur"></div>
                    <div className="relative rounded-lg p-6 border border-purple-300/20 backdrop-blur-sm bg-background/80">
                      <h3 className="font-medium mb-2 text-center">ASTROLOGICAL ADVICE</h3>
                      <p className="text-center italic">{horoscope.advice}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Button onClick={generateHoroscope}>Generate Horoscope</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
