"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

// IMPORTANT: This page should only be used in development environments
export default function AuthBypassPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleBypass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      // This is a direct admin operation that should only be available in development
      // In production, this would require admin privileges
      const { data, error } = await supabase.auth.admin.updateUserById(
        "user_id_here", // You would need to get the actual user ID
        { email_confirm: true },
      )

      if (error) {
        setResult({
          success: false,
          message: `Failed: ${error.message}. Note: This operation requires admin privileges.`,
        })
      } else {
        setResult({
          success: true,
          message: "Email confirmation bypassed successfully. You can now log in.",
        })
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: `Error: ${err.message}. This feature may not be available in your environment.`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <Card className="w-full max-w-md border-red-500/20 border-2 backdrop-blur-sm bg-background/80">
        <CardHeader className="bg-red-500/10">
          <CardTitle className="text-2xl text-red-500">Development Only</CardTitle>
          <CardDescription>Email confirmation bypass tool</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: Development Tool</AlertTitle>
            <AlertDescription>
              This page should only be used during development and testing. It bypasses security measures and should
              never be deployed to production.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleBypass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bypass-email">User Email</Label>
              <Input
                id="bypass-email"
                type="email"
                placeholder="Enter user email to bypass confirmation"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Bypass Email Confirmation"}
            </Button>
          </form>

          {result && (
            <Alert
              className={`mt-4 ${result.success ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Note: This tool requires admin privileges and may not work in all environments.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
