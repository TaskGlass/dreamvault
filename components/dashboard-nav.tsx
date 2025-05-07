"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Brain, BookOpen, BarChart3, Settings, LogOut, Plus, Home, Sparkles } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { getUserProfile } from "@/lib/dream-service"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function DashboardNav() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
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

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Dream Journal",
      href: "/dashboard/journal",
      icon: BookOpen,
    },
    {
      title: "Insights",
      href: "/dashboard/insights",
      icon: BarChart3,
    },
    {
      title: "Interpret Dream",
      href: "/dashboard/interpret",
      icon: Brain,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

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

  // Get plan display name
  const getPlanName = () => {
    if (!profile) return "Free Plan"

    switch (profile?.subscription_tier) {
      case "pro":
        return "Astral Voyager"
      case "starter":
        return "Lucid Explorer"
      default:
        return "Dreamer Lite"
    }
  }

  // Get plan badge color
  const getPlanBadgeClass = () => {
    if (!profile) return "bg-gray-500"

    switch (profile?.subscription_tier) {
      case "pro":
        return "bg-gradient-to-r from-indigo-500 to-blue-500"
      case "starter":
        return "bg-gradient-to-r from-purple-500 to-indigo-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="text-base">
      <SidebarHeader className="flex flex-col items-center justify-center p-4">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            DreamVault
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold sr-only">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="text-base py-3"
                  >
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <Button
              className="w-full justify-start gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-sm py-4"
              asChild
            >
              <Link href="/dashboard/interpret">
                <Plus className="h-5 w-5" />
                New Dream
              </Link>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Plan information */}
        {profile && (
          <div className="mb-4 p-3 rounded-lg border border-purple-300/20 bg-background/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-sm font-medium">{getPlanName()}</span>
              </div>
              <Badge className={`text-xs px-1.5 py-0 h-5 ${getPlanBadgeClass()}`}>
                {profile?.subscription_tier?.toUpperCase() || "FREE"}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dreams Used</span>
                <span className="font-medium">
                  {profile?.dreams_count} / {profile?.dreams_limit}
                </span>
              </div>
              <Progress
                value={((profile?.dreams_count || 0) / (profile?.dreams_limit || 1)) * 100}
                className="h-1.5 bg-purple-100/10"
              />
            </div>
          </div>
        )}

        {/* User profile */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-purple-200/20">
            <AvatarImage
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""}
              alt={profile?.full_name || user?.user_metadata?.full_name || "User"}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium truncate">
              {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={signOut} className="text-base py-3">
              <button className="w-full flex items-center">
                <LogOut className="h-5 w-5 mr-3" />
                <span className="font-medium">Log out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
