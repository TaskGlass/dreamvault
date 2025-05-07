"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Sparkles, Save, Share2, Download, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shareDreamContent } from "@/lib/dream-service"

interface DreamInterpretationProps {
  interpretation: any
  dreamText: string
  onSave: () => void
  dreamId?: string
}

export function DreamInterpretation({ interpretation, dreamText, onSave, dreamId }: DreamInterpretationProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [loadingArtwork, setLoadingArtwork] = useState(false)
  const [sharingArtwork, setSharingArtwork] = useState(false)
  const [sharingAffirmation, setSharingAffirmation] = useState(false)

  useEffect(() => {
    // Generate artwork when component mounts
    if (interpretation && !artworkUrl) {
      generateArtwork()
    }
  }, [interpretation])

  const handleSave = async () => {
    setSaving(true)
    await onSave()
    setSaving(false)
  }

  const generateArtwork = async () => {
    if (!interpretation) return

    setLoadingArtwork(true)
    try {
      const response = await fetch("/api/generate-artwork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText, interpretation }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate artwork")
      }

      const data = await response.json()
      setArtworkUrl(data.imageUrl)
    } catch (error) {
      console.error("Error generating artwork:", error)
      toast({
        title: "Error",
        description: "Failed to generate dream artwork. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingArtwork(false)
    }
  }

  const handleShareArtwork = async () => {
    if (!artworkUrl) return

    setSharingArtwork(true)
    try {
      const { shareUrl, error } = await shareDreamContent(
        "artwork",
        artworkUrl,
        dreamId,
        interpretation?.summary ? `Dream: ${interpretation.summary.substring(0, 50)}...` : "Dream Artwork",
      )

      if (error) throw error

      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Artwork shared",
          description: "Share link copied to clipboard!",
        })
      }
    } catch (error) {
      console.error("Error sharing artwork:", error)
      toast({
        title: "Error",
        description: "Failed to share artwork. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSharingArtwork(false)
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
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12h5"></path>
              <path d="M17 12h5"></path>
              <path d="M12 2v5"></path>
              <path d="M12 17v5"></path>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
            <span className="hidden sm:inline">Insights</span>
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

        <TabsContent value="insights">
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-500"
                >
                  <path d="M2 12h5"></path>
                  <path d="M17 12h5"></path>
                  <path d="M12 2v5"></path>
                  <path d="M12 17v5"></path>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
                Deeper Insights
              </CardTitle>
              <CardDescription>Personal meaning and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground text-center sm:text-left">
                  PERSONAL INSIGHTS
                </h3>
                <p className="text-muted-foreground text-center sm:text-left">{interpretation.insights}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground text-center sm:text-left">
                  RECOMMENDATIONS
                </h3>
                <p className="text-muted-foreground text-center sm:text-left">{interpretation.recommendations}</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 bg-muted/50 flex justify-center sm:justify-between p-4">
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
                <span className="hidden sm:inline">{sharingAffirmation ? "Sharing..." : "Share Affirmation"}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 hidden sm:flex" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save to Journal</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Dream Artwork
          </CardTitle>
          <CardDescription>AI-generated visualization of your dream</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {loadingArtwork ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
              <p className="text-muted-foreground">Generating dream artwork...</p>
            </div>
          ) : artworkUrl ? (
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={artworkUrl || "/placeholder.svg"}
                  alt="AI-generated dream artwork"
                  className="w-full h-auto"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Button onClick={generateArtwork}>Generate Artwork</Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center sm:justify-end gap-2 border-t border-border/50 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleShareArtwork}
            disabled={!artworkUrl || sharingArtwork}
          >
            {sharingArtwork ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{sharingArtwork ? "Sharing..." : "Share"}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" disabled={!artworkUrl} asChild>
            {artworkUrl ? (
              <a href={artworkUrl} download="dream-artwork.jpg" target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : (
              <span>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
