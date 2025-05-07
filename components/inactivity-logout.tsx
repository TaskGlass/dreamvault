"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// Inactivity timeout in milliseconds (10 minutes)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000
// Warning timeout in milliseconds (1 minute before logout)
const WARNING_TIMEOUT = 9 * 60 * 1000

export function InactivityLogout() {
  const { signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningToastIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Function to reset the timer
    const resetTimer = () => {
      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }

      // Clear existing warning toast if it exists
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current)
        warningToastIdRef.current = null
      }

      // Set warning timeout (9 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        const toastId = toast({
          title: "Session Expiring Soon",
          description: "You'll be logged out in 1 minute due to inactivity.",
          duration: 60000, // Keep the toast visible for the full minute
          variant: "warning",
        }).id
        warningToastIdRef.current = toastId
      }, WARNING_TIMEOUT)

      // Set logout timeout (10 minutes)
      timeoutRef.current = setTimeout(() => {
        handleLogout()
      }, INACTIVITY_TIMEOUT)
    }

    // Function to handle logout
    const handleLogout = async () => {
      try {
        await signOut()
        toast({
          title: "Logged Out",
          description: "You've been logged out due to inactivity.",
          duration: 5000,
        })
        router.push("/")
      } catch (error) {
        console.error("Error during auto-logout:", error)
      }
    }

    // Events to track user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Initialize the timer
    resetTimer()

    // Cleanup function
    return () => {
      // Remove event listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }

      // Clear toast
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current)
      }
    }
  }, [signOut, router, toast])

  // This component doesn't render anything visible
  return null
}
