"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Close the mobile menu when the route changes
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Function to close the menu when a link is clicked
  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-8 w-8" /> {/* Increased size from h-6 w-6 to h-8 w-8 */}
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link href="/" className="flex items-center" onClick={handleLinkClick}>
            <span className="font-bold">DreamVault</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 px-2 mt-8">
          <Link href="/" className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent" onClick={handleLinkClick}>
            Home
          </Link>
          <Link
            href="/#features"
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
            onClick={handleLinkClick}
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
            onClick={handleLinkClick}
          >
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
              onClick={handleLinkClick}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={handleLinkClick}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={handleLinkClick}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
