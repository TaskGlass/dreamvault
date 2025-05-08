import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { InactivityLogout } from "@/components/inactivity-logout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {/* Client component for inactivity logout */}
      <InactivityLogout />

      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background/80 to-background md:flex-row w-full min-w-0">
        <DashboardNav />
        <SidebarInset className="flex-1 flex flex-col min-w-0 w-full">
          <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 w-full">
            <a href="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="text-lg font-bold">DreamVault</span>
            </a>
          </header>
          <main className="flex-1 w-full min-w-0">
            <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 pb-16 md:pb-10">{children}</div>
          </main>
          <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-2 z-10 w-full">
            <div className="flex justify-around items-center">
              <MobileNavButtons />
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Mobile navigation buttons for quick access
function MobileNavButtons() {
  return (
    <>
      <a href="/dashboard" className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-xs mt-1">Home</span>
      </a>
      <a
        href="/dashboard/journal"
        className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <span className="text-xs mt-1">Journal</span>
      </a>
      <a
        href="/dashboard/interpret"
        className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </div>
      </a>
      <a
        href="/dashboard/insights"
        className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span className="text-xs mt-1">Insights</span>
      </a>
      <a
        href="/dashboard/settings"
        className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-xs mt-1">Settings</span>
      </a>
    </>
  )
}
