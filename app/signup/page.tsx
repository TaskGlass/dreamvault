"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, AlertCircle, Mail, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "free"
  const router = useRouter()
  const { signUp, user } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [name, setName] = useState("")

  // Birthday state
  const [birthYear, setBirthYear] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")

  const [loading, setLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)

  // Generate arrays for the dropdown options
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 100 + i).toString())
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Calculate days in month based on selected year and month
  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))

    const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, "0"))
  }

  const days = getDaysInMonth(birthYear, birthMonth)

  // Format birthday in YYYY-MM-DD format for database
  const getBirthdayString = () => {
    if (!birthYear || !birthMonth || !birthDay) return ""
    return `${birthYear}-${birthMonth}-${birthDay}`
  }

  // Check if passwords match whenever either password field changes
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    } else {
      setPasswordsMatch(true) // Don't show error when confirm field is empty
    }
  }, [password, confirmPassword])

  // Recalculate days when year or month changes
  useEffect(() => {
    // If the selected day is greater than days in the new month, reset to the last day of the month
    const daysInMonth = getDaysInMonth(birthYear, birthMonth).length
    if (birthDay && Number.parseInt(birthDay) > daysInMonth) {
      setBirthDay(daysInMonth.toString().padStart(2, "0"))
    }
  }, [birthYear, birthMonth])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordsMatch(false)
      return
    }

    // Validate birthday is complete
    const birthday = getBirthdayString()
    if (!birthday) {
      toast({
        title: "Birthday required",
        description: "Please select your complete birth date for horoscope features.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, { full_name: name, birthday })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Show success message instead of redirecting
      setSignupComplete(true)
      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const planTitles = {
    free: "Dreamer Lite",
    starter: "Lucid Explorer",
    pro: "Astral Voyager",
  }

  if (signupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
        <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <CardHeader className="py-4">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-2">
            <Alert className="border-purple-500/50 bg-purple-500/10">
              <Mail className="h-4 w-4 text-purple-500" />
              <AlertTitle>Verification required</AlertTitle>
              <AlertDescription>
                We've sent a confirmation email to <strong>{email}</strong>. Please check your inbox and click the link
                to verify your account.
              </AlertDescription>
            </Alert>
            <div className="text-center text-muted-foreground">
              <p>Once you've confirmed your email, you can log in to your account.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-4">
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to home
      </Link>

      <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <CardHeader className="py-3.5">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            {plan !== "free"
              ? `Start your free trial of ${planTitles[plan as keyof typeof planTitles]}`
              : "Get started with DreamVault for free"}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <Alert className="mb-3.5 py-2 border-blue-500/50 bg-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription>You'll need to verify your email address before you can log in.</AlertDescription>
          </Alert>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Birthday</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Required for horoscope features</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-9 border-purple-300/20 focus-visible:ring-purple-500/30"
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`h-9 border-purple-300/20 focus-visible:ring-purple-500/30 ${
                  !passwordsMatch ? "border-red-500 focus-visible:ring-red-500/30" : ""
                }`}
              />
              {!passwordsMatch && (
                <div className="flex items-center text-xs text-red-500 mt-0.5">
                  <XCircle className="h-3 w-3 mr-1" />
                  Passwords do not match
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10"
              disabled={loading || !passwordsMatch}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-1.5 py-3">
          <div className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our
            <Link href="/terms" className="underline ml-1">
              Terms of Service
            </Link>{" "}
            and
            <Link href="/privacy" className="underline ml-1">
              Privacy Policy
            </Link>
            .
          </div>
          <div className="text-center text-xs">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
