"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TerminalSettings } from "./terminal-settings"
import { TerminalHeader } from "./terminal-header"
import { useTerminal } from "@/hooks/use-terminal"
import { CommandProcessor } from "./command-processor"
import { ValidationUtils } from "@/utils/validation"
import type { ColorScheme } from "@/types/terminal"
import { TerminalLine } from "./terminal-line"

export function Terminal() {
  const {
    tabs,
    activeTab,
    setActiveTab,
    settings,
    getCurrentTab,
    addNewTab,
    updateTabLines,
    updateTabHistory,
    clearTab,
    updateSettings,
  } = useTerminal()

  const [currentCommand, setCurrentCommand] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleTerminalClick = () => {
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [tabs, activeTab])

  const processCommand = (command: string) => {
    const currentTab = getCurrentTab()
    const cmd = command.trim()

    // Validate command before processing
    const validation = ValidationUtils.validateCommand(cmd)
    if (!validation.isValid) {
      console.warn("[v0] Invalid command:", validation.error)
      return
    }

    if (cmd === "clear") {
      clearTab(activeTab)
      return
    }

    try {
      const newLines = CommandProcessor.processCommand(command, currentTab, () => setShowSettings(true))
      updateTabLines(activeTab, [...currentTab.lines, ...newLines])
      updateTabHistory(activeTab, cmd)
    } catch (error) {
      console.error("[v0] Error processing command:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentCommand.trim()) {
      processCommand(currentCommand)
      setCurrentCommand("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentTab = getCurrentTab()

    if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      clearTab(activeTab)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const newIndex = Math.min(currentTab.historyIndex + 1, currentTab.commandHistory.length - 1)
      if (newIndex >= 0 && currentTab.commandHistory.length > 0) {
        const historyCommand = currentTab.commandHistory[currentTab.commandHistory.length - 1 - newIndex]
        setCurrentCommand(historyCommand || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newIndex = Math.max(currentTab.historyIndex - 1, -1)
      if (newIndex === -1) {
        setCurrentCommand("")
      } else if (currentTab.commandHistory.length > 0) {
        const historyCommand = currentTab.commandHistory[currentTab.commandHistory.length - 1 - newIndex]
        setCurrentCommand(historyCommand || "")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Basic tab completion could be implemented here
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = ValidationUtils.sanitizeInput(e.target.value)
    setCurrentCommand(sanitizedValue)
  }

  const getColorSchemeClasses = () => {
    const schemes: Record<ColorScheme, string> = {
      default: "bg-background text-foreground",
      matrix: "bg-black text-green-400",
      ocean: "bg-blue-950 text-cyan-300",
      sunset: "bg-orange-950 text-orange-200",
      purple: "bg-purple-950 text-purple-200",
      graphql: "bg-pink-950 text-pink-300",
      yaml: "bg-indigo-950 text-indigo-200",
    }
    return schemes[settings.colorScheme as ColorScheme] || schemes.default
  }

  const handleSettingsUpdate = (newSettings: Partial<typeof settings>) => {
    const validation = ValidationUtils.validateSettings(newSettings)
    if (validation.isValid) {
      updateSettings(newSettings)
    } else {
      console.warn("[v0] Invalid settings:", validation.error)
    }
  }

  const currentTab = getCurrentTab()

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card
          className={`border-border transition-all duration-300 shadow-2xl ${
            settings.isMaximized ? "w-full h-full" : "w-full max-w-4xl h-[600px]"
          }`}
          style={{ opacity: settings.opacity }}
        >
          <TerminalHeader
            currentShellName={currentTab.shellSystem.getShellConfig().name}
            onAddTab={addNewTab}
            onOpenSettings={() => setShowSettings(true)}
            isMaximized={settings.isMaximized}
            onToggleMaximize={() => handleSettingsUpdate({ isMaximized: !settings.isMaximized })}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-auto bg-muted/10 border-b">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs font-mono data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all"
                >
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0">
                <div
                  className={`flex-1 font-mono cursor-text transition-all duration-200 ${getColorSchemeClasses()}`}
                  onClick={handleTerminalClick}
                  style={{ fontSize: `${settings.fontSize}px` }}
                >
                  <ScrollArea className="h-full">
                    <div ref={scrollRef} className="p-4 space-y-1">
                      {tab.lines.map((line) => (
                        <TerminalLine
                          key={line.id}
                          content={line.content}
                          type={line.type}
                          colorScheme={settings.colorScheme}
                        />
                      ))}

                      {tab.id === activeTab && (
                        <form onSubmit={handleSubmit} className="flex items-center animate-in fade-in-0 duration-200">
                          <span className="text-primary mr-2 font-medium">
                            {tab.shellSystem.getPrompt(tab.fileSystem.getCurrentPath())}
                          </span>
                          <Input
                            ref={inputRef}
                            value={currentCommand}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none p-0 font-mono focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                            style={{
                              fontSize: `${settings.fontSize}px`,
                              color: settings.colorScheme === "default" ? undefined : "inherit",
                            }}
                            placeholder="Type a command..."
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </form>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>

      <TerminalSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fontSize={settings.fontSize}
        onFontSizeChange={(fontSize) => handleSettingsUpdate({ fontSize })}
        colorScheme={settings.colorScheme}
        onColorSchemeChange={(colorScheme) => handleSettingsUpdate({ colorScheme })}
        opacity={settings.opacity}
        onOpacityChange={(opacity) => handleSettingsUpdate({ opacity })}
      />
    </>
  )
}
