"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Topbar } from "@/components/layout/Topbar"
import { MobileNav } from "@/components/layout/MobileNav"

export function AppShell({
  user,
  children,
}: {
  user: { email?: string | null; name?: string | null }
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-auto pb-16 md:pb-4 p-4 md:p-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  )
}
