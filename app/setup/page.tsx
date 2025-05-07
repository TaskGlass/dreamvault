"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Database, CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const initializeDatabase = async () => {
    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/init-db", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setStatus("success")
        setMessage("Database initialized successfully! You can now use DreamVault.")
        toast({
          title: "Success",
          description: "Database has been set up successfully.",
        })
      } else {
        setStatus("error")
        setMessage(result.message || "Failed to initialize the database. Please try again.")
        toast({
          title: "Error",
          description: result.message || "Failed to initialize the database.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error initializing database:", error)
      setStatus("error")
      setMessage(error.message || "An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-500" />
            DreamVault Setup
          </CardTitle>
          <CardDescription>Initialize your database to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-500/10 border-blue-500/50">
            <AlertTitle>First-time setup</AlertTitle>
            <AlertDescription>
              This is a one-time setup process that will create the necessary database tables for DreamVault to work
              properly.
            </AlertDescription>
          </Alert>

          {status === "success" && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">What this will do:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li>Create the necessary database tables (dreams, dream_tags, profiles)</li>
              <li>Set up indexes for better performance</li>
              <li>Configure security policies for data access</li>
              <li>Initialize helper functions</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={initializeDatabase}
            disabled={loading || status === "success"}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Setup Complete
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Initialize Database
              </>
            )}
          </Button>

          {status === "success" && (
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
