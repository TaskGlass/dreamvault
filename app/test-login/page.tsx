"use client"

import type React from "react"

import { useState } from "react"
import { supabase, checkSupabaseConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown")
  const [connectionMessage, setConnectionMessage] = useState("")

  const testConnection = async () => {
    setLoading(true)
    try {
      const isConnected = await checkSupabaseConnection()
      setConnectionStatus(isConnected ? "success" : "error")
      setConnectionMessage(
        isConnected
          ? "Successfully connected to Supabase"
          : "Failed to connect to Supabase. Check your environment variables and network connection.",
      )
    } catch (error: any) {
      setConnectionStatus("error")
      setConnectionMessage(`Error testing connection: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      // Direct Supabase auth call
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      setResult({
        success: !error,
        data: data,
        error: error,
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: { message: `Unexpected error: ${error.message}` },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>Test your Supabase connection and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button onClick={testConnection} disabled={loading} variant="outline" className="w-full">
              {loading ? "Testing..." : "Test Supabase Connection"}
            </Button>

            {connectionStatus !== "unknown" && (
              <Alert variant={connectionStatus === "success" ? "default" : "destructive"}>
                {connectionStatus === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{connectionMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-password">Password</Label>
              <Input
                id="test-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Testing Login..." : "Test Login"}
            </Button>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Result:</h3>
              <div className="text-sm overflow-auto max-h-60">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">This page is for testing authentication only.</p>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
