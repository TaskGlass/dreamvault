"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token and type from URL
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "email_confirmation") {
          setStatus("error")
          setMessage("Invalid confirmation link. Please request a new one.")
          return
        }

        // Confirm the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        })

        if (error) {
          console.error("Confirmation error:", error)
          setStatus("error")
          setMessage(error.message || "Failed to confirm your email. Please try again.")
          return
        }

        setStatus("success")
        setMessage("Your email has been confirmed successfully!")
      } catch (err) {
        console.error("Unexpected error during confirmation:", err)
        setStatus("error")
        setMessage("An unexpected error occurred. Please try again.")
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <CardHeader>
          <CardTitle className="text-2xl">Email Confirmation</CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Verifying your email..."
              : status === "success"
                ? "Email confirmed!"
                : "Confirmation failed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" ? (
            <div className="flex justify-center py-8">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
                <div className="absolute inset-3 rounded-full bg-background"></div>
              </div>
            </div>
          ) : (
            <Alert
              variant={status === "success" ? "default" : "destructive"}
              className={status === "success" ? "border-green-500/50 bg-green-500/10" : ""}
            >
              {status === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== "loading" && (
            <Button asChild>
              <Link href={status === "success" ? "/login" : "/signup"}>
                {status === "success" ? "Go to Login" : "Back to Sign Up"}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
