import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HouseholdProvider } from "@/lib/use-household"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "HouseManagement",
  description: "Gestión personal del hogar — finanzas, compras, entretenimiento y más.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "HouseMgmt", statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              <HouseholdProvider>
                <ToastProvider />
                {children}
              </HouseholdProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
