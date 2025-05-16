"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Brain, Sparkles, Info, AlertTriangle } from "lucide-react"
import { DreamInterpretation } from "@/components/dream-interpretation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createDream } from "@/lib/dream-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function InterpretDreamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [dreamTitle, setDreamTitle] = useState("")
  const [dreamText, setDreamText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [interpretation, setInterpretation] = useState<any | null>(null)
  const [step, setStep] = useState<"input" | "processing" | "result">("input")
  const [error, setError] = useState<string | null>(null)

  const generateDreamTitle = async (text: string) => {
    if (!text.trim()) return

    try {
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText: text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate title")
      }

      const data = await response.json()
      setDreamTitle(data.title)
    } catch (error) {
      console.error("Error generating title:", error)
      // Set a fallback title based on the first few words
      const words = text.split(" ").slice(0, 4).join(" ")
      setDreamTitle(`Dream about ${words}...`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dreamText.trim()) return

    setIsLoading(true)
    setStep("processing")
    setError(null)

    try {
      // Call the API to interpret the dream
      const response = await fetch("/api/interpret-dream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText }),
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      // Now try to parse the JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error("Invalid response format from server")
      }

      // Check if the response contains an error
      if (data.error) {
        console.warn("API returned error:", data.error)
        // We'll still continue if we have the fallback fields
        if (!data.summary) {
          throw new Error(data.error)
        }
      }

      setInterpretation(data)
      setIsLoading(false)
      setStep("result")
    } catch (error) {
      console.error("Error interpreting dream:", error)
      setError(error instanceof Error ? error.message : "Failed to interpret dream")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to interpret your dream. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
      setStep("input")
    }
  }

  const handleSaveDream = async () => {
    if (!user) return

    try {
      // Extract tags from interpretation
      const tags = interpretation?.emotions || []

      // Create a title if none was provided
      const title = dreamTitle.trim() || "Untitled Dream"

      // Save the dream to the database
      const { dream, error } = await createDream(
        user.id,
        title,
        dreamText,
        interpretation?.emotions?.[0] || null,
        interpretation,
        tags,
      )

      if (error) {
        throw error
      }

      // Generate horoscope after dream is saved
      if (dream) {
        try {
          const horoscopeResponse = await fetch("/api/generate-horoscope", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dreamId: dream.id,
              dreamText,
              interpretation,
              userId: user.id,
            }),
          })
          if (!horoscopeResponse.ok) {
            const data = await horoscopeResponse.json()
            throw new Error(data.error || data.message || "Failed to generate horoscope")
          }
        } catch (err) {
          toast({
            title: "Horoscope Error",
            description: err instanceof Error ? err.message : "Failed to generate horoscope.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Dream saved",
        description: "Your dream has been saved to your journal.",
      })

      // Redirect to the journal
      router.push("/dashboard/journal")
    } catch (error) {
      console.error("Error saving dream:", error)
      toast({
        title: "Error",
        description: "Failed to save your dream. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 w-full">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 blur-xl animate-pulse"></div>
          <Brain className="relative z-10 h-16 w-16 text-purple-500 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Interpreting Your Dream</h2>
          <p className="text-muted-foreground max-w-md">
            Our AI is analyzing your dream patterns, symbols, and emotions to provide personalized insights...
          </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 max-w-md w-full">
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full animate-progress"></div>
          </div>
          <div className="text-xs text-muted-foreground">This may take a moment</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full min-w-0 flex-1">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Interpret Your Dream</h1>
        <p className="text-muted-foreground mt-2">Share your dream and receive AI-powered insights</p>
      </div>

      {step === "input" ? (
        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden w-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Describe Your Dream
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              The more details you provide, the more accurate your interpretation will be
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Include details like colors, people, emotions, and actions. What happened in the dream? How did
                      you feel?
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  Dream Title <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Give your dream a title..."
                  value={dreamTitle}
                  onChange={(e) => setDreamTitle(e.target.value)}
                  className="border-purple-300/20 focus-visible:ring-purple-500/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dream" className="flex items-center gap-1">
                  Dream Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="dream"
                  placeholder="I dreamt that I was flying over mountains..."
                  className="min-h-[200px] md:min-h-[300px] resize-none border-purple-300/20 focus-visible:ring-purple-500/30"
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {dreamText.length > 0 ? `${dreamText.length} characters` : "Start typing your dream..."}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Error: {error}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    There was an error interpreting your dream. Please try again or contact support if the issue
                    persists.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10"
                  disabled={!dreamText.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Interpreting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Interpret Dream
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <DreamInterpretation interpretation={interpretation} dreamText={dreamText} onSave={handleSaveDream} />
      )}
    </div>
  )
}
