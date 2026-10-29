import type { Metadata } from "next"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "TEKAS",
  description: "TEKAS — integração de ferramentas têxteis com tecnologias atuais",
}

import { Providers } from "@/components/providers"
import { QueryProvider } from "@/components/query-provider"

import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="font-sans" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Providers>
          <QueryProvider>{children}</QueryProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
