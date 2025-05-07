"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Bell } from "lucide-react"
import { DashboardNav } from "./dashboard-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile } from "@/lib/dream-service"

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      try {
        const userProfile = await getUserProfile(user.id)
        if (userProfile) {
          setProfile(userProfile)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchProfile()
  }, [user])

  // Get user initials for avatar fallback
  const getInitials = () => {
    const fullName = profile?.full_name || user?.user_metadata?.full_name
    if (!fullName) return "DV"

    const nameParts = fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0].substring(0, 2).toUpperCase()
  }

  return (
    <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-20">
      <div className="flex items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3 h-11 w-11">
              <Menu className="h-7 w-7" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <DashboardNav />
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center">
          <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            DreamVault
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
        </Button>

        <Avatar className="h-8 w-8 border border-purple-200/20">
          <AvatarImage
            src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""}
            alt={profile?.full_name || user?.user_metadata?.full_name || "User"}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
