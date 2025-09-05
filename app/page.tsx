"use client"

import { Terminal } from "@/components/terminal"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <main className="min-h-screen bg-background">
        <Terminal />
      </main>
    </ThemeProvider>
  )
}
