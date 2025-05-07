"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Mic, Loader2, Brain, Sparkles, Info, Square } from "lucide-react"
import { DreamInterpretation } from "@/components/dream-interpretation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createDream } from "@/lib/dream-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

// Declare SpeechRecognition and webkitSpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function InterpretDreamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [dreamTitle, setDreamTitle] = useState("")
  const [dreamText, setDreamText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [interpretation, setInterpretation] = useState<any | null>(null)
  const [step, setStep] = useState<"input" | "processing" | "result">("input")
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if ((typeof window !== "undefined" && "SpeechRecognition" in window) || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = dreamText

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += " " + transcript
          } else {
            interimTranscript += transcript
          }
        }

        setDreamText(finalTranscript.trim())
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        stopRecording()
        toast({
          title: "Microphone Error",
          description: `Error: ${event.error}. Please check your microphone permissions.`,
          variant: "destructive",
        })
      }

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // If we're still supposed to be recording, restart it
          // This helps with the continuous recording as the API sometimes stops
          recognitionRef.current?.start()
        } else {
          setTranscribing(true)
          // Generate a title if auto-generate is enabled and we have text
          if (autoGenerateTitle && dreamText.trim().length > 0) {
            generateDreamTitle(dreamText)
          }
          setTranscribing(false)
        }
      }
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try a different browser.",
        variant: "destructive",
      })
    }

    return () => {
      stopRecording()
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
      }
    }
  }, [dreamText, isRecording, autoGenerateTitle, toast])

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const startRecording = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsRecording(true)
      toast({
        title: "Recording Started",
        description: "Speak clearly to describe your dream...",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (dreamText.trim().length > 0) {
        toast({
          title: "Recording Stopped",
          description: "Your dream description has been captured.",
        })
      }
    } catch (error) {
      console.error("Error stopping recording:", error)
    }
  }

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

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

    try {
      // Call the API to interpret the dream
      const response = await fetch("/api/interpret-dream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText }),
      })

      if (!response.ok) {
        throw new Error("Failed to interpret dream")
      }

      const data = await response.json()
      setInterpretation(data)
      setIsLoading(false)
      setStep("result")
    } catch (error) {
      console.error("Error interpreting dream:", error)
      toast({
        title: "Error",
        description: "Failed to interpret your dream. Please try again.",
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Interpret Your Dream</h1>
        <p className="text-muted-foreground mt-2">Share your dream and receive AI-powered insights</p>
      </div>

      {step === "input" ? (
        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
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
                <div className="flex items-center gap-2">
                  <Switch id="auto-title" checked={autoGenerateTitle} onCheckedChange={setAutoGenerateTitle} />
                  <Label htmlFor="auto-title" className="text-sm text-muted-foreground">
                    Auto-generate title when using voice input
                  </Label>
                </div>
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
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse text-red-500">●</span>
                      <span className="text-xs">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {isRecording && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse text-red-500">●</span>
                      <span className="font-medium">Recording...</span>
                    </div>
                    <span className="text-sm">{formatTime(recordingTime)}</span>
                  </div>
                  <Progress value={Math.min((recordingTime / 120) * 100, 100)} className="h-1 bg-red-200/20" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Speak clearly to describe your dream. Click the stop button when finished.
                  </p>
                </div>
              )}

              {transcribing && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="font-medium">Processing speech...</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className={`rounded-full ${isRecording ? "bg-red-500/20 text-red-500 border-red-500" : ""}`}
                  onClick={handleVoiceInput}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10"
                  disabled={!dreamText.trim() || isLoading || isRecording}
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
