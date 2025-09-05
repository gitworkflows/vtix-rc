"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Maximize2, Minimize2, X, Settings, Plus } from "lucide-react"
import { TerminalSettings } from "./terminal-settings"
import { FileSystem } from "./file-system"
import { ShellSystem, type ShellType } from "./shell-system"

interface TerminalLine {
  id: string
  type: "command" | "output" | "error"
  content: string
  timestamp: Date
}

interface TerminalTab {
  id: string
  title: string
  lines: TerminalLine[]
  fileSystem: FileSystem
  commandHistory: string[]
  historyIndex: number
  shellSystem: ShellSystem
}

export function Terminal() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: "1",
      title: "Terminal 1",
      lines: [
        {
          id: "1",
          type: "output",
          content: "Welcome to Hyper Terminal v1.0.0",
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "output",
          content: 'Type "help" for available commands',
          timestamp: new Date(),
        },
      ],
      fileSystem: new FileSystem(),
      commandHistory: [],
      historyIndex: -1,
      shellSystem: new ShellSystem(),
    },
  ])
  const [activeTab, setActiveTab] = useState("1")
  const [currentCommand, setCurrentCommand] = useState("")
  const [isMaximized, setIsMaximized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [colorScheme, setColorScheme] = useState("default")
  const [opacity, setOpacity] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const getCurrentTab = () => tabs.find((tab) => tab.id === activeTab) || tabs[0]

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
    const expandedCmd = currentTab.shellSystem.expandAlias(cmd)
    const args = expandedCmd.split(" ")
    const baseCmd = args[0].toLowerCase()

    const prompt = currentTab.shellSystem.getPrompt(currentTab.fileSystem.getCurrentPath())

    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      type: "command",
      content: `${prompt} ${command}`,
      timestamp: new Date(),
    }

    let outputLines: TerminalLine[] = []

    switch (baseCmd) {
      case "help":
        outputLines = [
          {
            id: `${Date.now()}-1`,
            type: "output",
            content: "Available commands:",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-2`,
            type: "output",
            content: "  help     - Show this help message",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-3`,
            type: "output",
            content: "  clear    - Clear terminal screen",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-4`,
            type: "output",
            content: "  ls       - List directory contents",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-5`,
            type: "output",
            content: "  cd       - Change directory",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-6`,
            type: "output",
            content: "  pwd      - Print working directory",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-7`,
            type: "output",
            content: "  mkdir    - Create directory",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-8`,
            type: "output",
            content: "  cat      - Display file contents",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-9`,
            type: "output",
            content: "  echo     - Echo text back",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-10`,
            type: "output",
            content: "  date     - Show current date and time",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-11`,
            type: "output",
            content: "  shell    - Change shell (bash, zsh, fish, powershell)",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-12`,
            type: "output",
            content: "  source   - Load shell configuration file",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-13`,
            type: "output",
            content: "  env      - Show environment variables",
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-14`,
            type: "output",
            content: "  history  - Show command history",
            timestamp: new Date(),
          },
        ]
        break
      case "shell":
        if (args[1]) {
          const newShell = args[1].toLowerCase() as ShellType
          if (["bash", "zsh", "fish", "powershell"].includes(newShell)) {
            currentTab.shellSystem.setShell(newShell)
            outputLines = [
              {
                id: Date.now().toString(),
                type: "output",
                content: `Switched to ${currentTab.shellSystem.getShellConfig().name}`,
                timestamp: new Date(),
              },
            ]
          } else {
            outputLines = [
              {
                id: Date.now().toString(),
                type: "error",
                content: "Available shells: bash, zsh, fish, powershell",
                timestamp: new Date(),
              },
            ]
          }
        } else {
          const currentShellName = currentTab.shellSystem.getShellConfig().name
          outputLines = [
            {
              id: Date.now().toString(),
              type: "output",
              content: `Current shell: ${currentShellName}`,
              timestamp: new Date(),
            },
          ]
        }
        break
      case "source":
        if (args[1]) {
          const configContent = currentTab.fileSystem.readFile(args[1])
          if (configContent !== null) {
            currentTab.shellSystem.loadConfigFile(configContent)
            outputLines = [
              {
                id: Date.now().toString(),
                type: "output",
                content: `Loaded configuration from ${args[1]}`,
                timestamp: new Date(),
              },
            ]
          } else {
            outputLines = [
              {
                id: Date.now().toString(),
                type: "error",
                content: `source: ${args[1]}: No such file or directory`,
                timestamp: new Date(),
              },
            ]
          }
        } else {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "error",
              content: "source: missing operand",
              timestamp: new Date(),
            },
          ]
        }
        break
      case "env":
        const config = currentTab.shellSystem.getShellConfig()
        outputLines = Object.entries(config.variables).map(([key, value], index) => ({
          id: `${Date.now()}-${index}`,
          type: "output" as const,
          content: `${key}=${value}`,
          timestamp: new Date(),
        }))
        break
      case "clear":
        setTabs((prev) => prev.map((tab) => (tab.id === activeTab ? { ...tab, lines: [] } : tab)))
        return
      case "ls":
        const files = currentTab.fileSystem.listDirectory()
        if (files.length === 0) {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "output",
              content: "Directory is empty",
              timestamp: new Date(),
            },
          ]
        } else {
          outputLines = files.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            type: "output" as const,
            content: `${file.permissions} ${file.size.toString().padStart(8)} ${file.modified.toLocaleDateString()} ${file.name}${file.type === "directory" ? "/" : ""}`,
            timestamp: new Date(),
          }))
        }
        break
      case "cd":
        const targetDir = args[1] || "/"
        if (currentTab.fileSystem.changeDirectory(targetDir)) {
          outputLines = []
        } else {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "error",
              content: `cd: ${targetDir}: No such file or directory`,
              timestamp: new Date(),
            },
          ]
        }
        break
      case "pwd":
        outputLines = [
          {
            id: Date.now().toString(),
            type: "output",
            content: currentTab.fileSystem.getCurrentPath(),
            timestamp: new Date(),
          },
        ]
        break
      case "mkdir":
        if (args[1]) {
          if (currentTab.fileSystem.createDirectory(args[1])) {
            outputLines = []
          } else {
            outputLines = [
              {
                id: Date.now().toString(),
                type: "error",
                content: `mkdir: ${args[1]}: File exists`,
                timestamp: new Date(),
              },
            ]
          }
        } else {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "error",
              content: "mkdir: missing operand",
              timestamp: new Date(),
            },
          ]
        }
        break
      case "cat":
        if (args[1]) {
          const content = currentTab.fileSystem.readFile(args[1])
          if (content !== null) {
            outputLines = content.split("\n").map((line, index) => ({
              id: `${Date.now()}-${index}`,
              type: "output" as const,
              content: line,
              timestamp: new Date(),
            }))
          } else {
            outputLines = [
              {
                id: Date.now().toString(),
                type: "error",
                content: `cat: ${args[1]}: No such file or directory`,
                timestamp: new Date(),
              },
            ]
          }
        } else {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "error",
              content: "cat: missing operand",
              timestamp: new Date(),
            },
          ]
        }
        break
      case "history":
        outputLines = currentTab.commandHistory.map((histCmd, index) => ({
          id: `${Date.now()}-${index}`,
          type: "output" as const,
          content: `${index + 1}  ${histCmd}`,
          timestamp: new Date(),
        }))
        break
      case "date":
        outputLines = [
          {
            id: Date.now().toString(),
            type: "output",
            content: new Date().toString(),
            timestamp: new Date(),
          },
        ]
        break
      case "theme":
        outputLines = [
          {
            id: `${Date.now()}-1`,
            type: "output",
            content: `Current theme: ${colorScheme}`,
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-2`,
            type: "output",
            content: `Font size: ${fontSize}px`,
            timestamp: new Date(),
          },
          {
            id: `${Date.now()}-3`,
            type: "output",
            content: `Opacity: ${Math.round(opacity * 100)}%`,
            timestamp: new Date(),
          },
        ]
        break
      case "settings":
        setShowSettings(true)
        outputLines = [
          {
            id: Date.now().toString(),
            type: "output",
            content: "Opening terminal settings...",
            timestamp: new Date(),
          },
        ]
        break
      default:
        if (cmd.startsWith("echo ")) {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "output",
              content: command.slice(5),
              timestamp: new Date(),
            },
          ]
        } else if (cmd === "") {
          outputLines = []
        } else {
          outputLines = [
            {
              id: Date.now().toString(),
              type: "error",
              content: `Command not found: ${baseCmd}. Type "help" for available commands.`,
              timestamp: new Date(),
            },
          ]
        }
    }

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              lines: [...tab.lines, commandLine, ...outputLines],
              commandHistory: cmd ? [...tab.commandHistory, cmd] : tab.commandHistory,
              historyIndex: -1,
            }
          : tab,
      ),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processCommand(currentCommand)
    setCurrentCommand("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentTab = getCurrentTab()

    if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setTabs((prev) => prev.map((tab) => (tab.id === activeTab ? { ...tab, lines: [] } : tab)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const newIndex = Math.min(currentTab.historyIndex + 1, currentTab.commandHistory.length - 1)
      if (newIndex >= 0) {
        setCurrentCommand(currentTab.commandHistory[currentTab.commandHistory.length - 1 - newIndex])
        setTabs((prev) => prev.map((tab) => (tab.id === activeTab ? { ...tab, historyIndex: newIndex } : tab)))
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newIndex = Math.max(currentTab.historyIndex - 1, -1)
      if (newIndex === -1) {
        setCurrentCommand("")
      } else {
        setCurrentCommand(currentTab.commandHistory[currentTab.commandHistory.length - 1 - newIndex])
      }
      setTabs((prev) => prev.map((tab) => (tab.id === activeTab ? { ...tab, historyIndex: newIndex } : tab)))
    }
  }

  const addNewTab = () => {
    const newId = (tabs.length + 1).toString()
    const newTab: TerminalTab = {
      id: newId,
      title: `Terminal ${newId}`,
      lines: [
        {
          id: "1",
          type: "output",
          content: "Welcome to Hyper Terminal v1.0.0",
          timestamp: new Date(),
        },
      ],
      fileSystem: new FileSystem(),
      commandHistory: [],
      historyIndex: -1,
      shellSystem: new ShellSystem(),
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTab(newId)
  }

  const getColorSchemeClasses = () => {
    switch (colorScheme) {
      case "matrix":
        return "bg-black text-green-400"
      case "ocean":
        return "bg-blue-950 text-cyan-300"
      case "sunset":
        return "bg-orange-950 text-orange-200"
      case "purple":
        return "bg-purple-950 text-purple-200"
      case "graphql":
        return "bg-pink-950 text-pink-300"
      case "yaml":
        return "bg-indigo-950 text-indigo-200"
      default:
        return "bg-background text-foreground"
    }
  }

  const currentTab = getCurrentTab()

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card
          className={`border-border transition-all duration-300 bg-black ${
            isMaximized ? "w-full h-full" : "w-full max-w-4xl h-[600px]"
          }`}
          style={{ opacity }}
        >
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm font-medium text-foreground ml-2">Hyper Terminal</span>
              <span className="text-xs text-muted-foreground ml-2">
                [{currentTab.shellSystem.getShellConfig().name}]
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={addNewTab}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 text-black" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMaximized(!isMaximized)}>
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-auto bg-muted/10">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0">
                <div
                  className={`flex-1 font-mono cursor-text ${getColorSchemeClasses()}`}
                  onClick={handleTerminalClick}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <ScrollArea className="h-full">
                    <div ref={scrollRef} className="p-4 space-y-1">
                      {tab.lines.map((line) => (
                        <div key={line.id} className="flex">
                          <span
                            className={`${
                              line.type === "command"
                                ? "text-primary"
                                : line.type === "error"
                                  ? "text-destructive"
                                  : colorScheme === "default"
                                    ? "text-foreground"
                                    : "inherit"
                            }`}
                          >
                            {line.content}
                          </span>
                        </div>
                      ))}

                      {tab.id === activeTab && (
                        <form onSubmit={handleSubmit} className="flex items-center">
                          <span className="text-primary mr-2">
                            {tab.shellSystem.getPrompt(tab.fileSystem.getCurrentPath())}
                          </span>
                          <Input
                            ref={inputRef}
                            value={currentCommand}
                            onChange={(e) => setCurrentCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none p-0 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                            style={{
                              fontSize: `${fontSize}px`,
                              color: colorScheme === "default" ? undefined : "inherit",
                            }}
                            placeholder="Type a command..."
                            autoFocus
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
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        colorScheme={colorScheme}
        onColorSchemeChange={setColorScheme}
        opacity={opacity}
        onOpacityChange={setOpacity}
      />
    </>
  )
}
