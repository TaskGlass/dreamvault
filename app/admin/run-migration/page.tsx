"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function RunMigrationPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/run-migration")
      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || "Migration completed successfully" })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to run migration",
        })
      }
    } catch (error) {
      console.error("Error running migration:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Run Database Migration</CardTitle>
          <CardDescription>Add the birthday column to the profiles table for horoscope features</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will add the birthday column to the profiles table if it doesn't already exist. This is required for
            the horoscope features to work properly.
          </p>

          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runMigration} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              "Run Migration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
