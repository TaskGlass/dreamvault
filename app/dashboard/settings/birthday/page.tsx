"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { updateUserProfile, getUserProfile } from "@/lib/dream-service"
import { Loader2, Calendar, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BirthdaySettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [month, setMonth] = useState<string>("")
  const [day, setDay] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [daysInMonth, setDaysInMonth] = useState<number[]>([])

  // Generate arrays for the dropdowns
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Function to get days in a month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  // Update days when month or year changes
  useEffect(() => {
    if (month && year) {
      const numDays = getDaysInMonth(Number.parseInt(month), Number.parseInt(year))
      setDaysInMonth(Array.from({ length: numDays }, (_, i) => i + 1))

      // If the current day is greater than the number of days in the month, reset it
      if (day && Number.parseInt(day) > numDays) {
        setDay("")
      }
    }
  }, [month, year])

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const profile = await getUserProfile(user.id)

        if (profile && profile.birthday) {
          const date = new Date(profile.birthday)
          setMonth((date.getMonth() + 1).toString())
          setDay(date.getDate().toString())
          setYear(date.getFullYear().toString())
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user || !month || !day || !year) {
      toast({
        title: "Error",
        description: "Please select a valid date",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      // Format the birthday as YYYY-MM-DD
      const formattedMonth = month.padStart(2, "0")
      const formattedDay = day.padStart(2, "0")
      const birthday = `${year}-${formattedMonth}-${formattedDay}`

      const { success, error } = await updateUserProfile(user.id, { birthday })

      if (!success) {
        throw new Error(error?.message || "Failed to update birthday")
      }

      toast({
        title: "Success",
        description: "Your birthday has been updated",
      })

      // Redirect back to settings
      router.push("/dashboard/settings")
    } catch (error: any) {
      console.error("Error updating birthday:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update birthday",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push("/dashboard/settings")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Settings
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Update Your Birthday
          </CardTitle>
          <CardDescription>
            Your birthday is used to provide personalized horoscope interpretations for your dreams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="month" className="text-sm font-medium">
                Month
              </label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="day" className="text-sm font-medium">
                Day
              </label>
              <Select value={day} onValueChange={setDay} disabled={!month || !year}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {daysInMonth.map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">
                Year
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={!month || !day || !year || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Birthday"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
