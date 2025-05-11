"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SupabaseReconnect() {
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true)
      setStatus("idle")
      setMessage("")

      const response = await fetch("/api/reconnect-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
        toast({
          title: "Connection Successful",
          description: "Successfully reconnected to Supabase",
        })
      } else {
        setStatus("error")
        setMessage(data.message)
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "An unexpected error occurred")
      toast({
        title: "Connection Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsReconnecting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection</CardTitle>
        <CardDescription>Reconnect to Supabase to refresh your connection</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}
        {status === "error" && (
          <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-gray-500 mb-4">
          If you're experiencing connection issues with Supabase, you can try reconnecting to refresh the connection.
          This will reload your environment variables and establish a new connection.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleReconnect} disabled={isReconnecting} className="w-full">
          {isReconnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Reconnecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconnect to Supabase
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
