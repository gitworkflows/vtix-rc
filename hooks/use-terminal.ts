"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import type { TerminalTab, TerminalLine, TerminalSettings } from "@/types/terminal"
import { FileSystem } from "@/components/file-system"
import { ShellSystem } from "@/components/shell-system"

export function useTerminal() {
  const [tabs, setTabs] = useState<TerminalTab[]>(() => [
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
  const [settings, setSettings] = useState<TerminalSettings>({
    fontSize: 14,
    colorScheme: "default",
    opacity: 1,
    isMaximized: false,
  })

  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const getCurrentTab = useCallback(() => {
    return tabsRef.current.find((tab) => tab.id === activeTab) || tabsRef.current[0]
  }, [activeTab])

  const addNewTab = useCallback(() => {
    const newId = (tabsRef.current.length + 1).toString()
    const newTab: TerminalTab = {
      id: newId,
      title: `Terminal ${newId}`,
      lines: [
        {
          id: "welcome-1",
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
  }, [])

  const updateTabLines = useCallback((tabId: string, newLines: TerminalLine[]) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab

        const maxLines = 1000
        const lines = newLines.length > maxLines ? newLines.slice(-maxLines) : newLines

        return { ...tab, lines }
      }),
    )
  }, [])

  const updateTabHistory = useCallback((tabId: string, command: string) => {
    if (!command.trim()) return

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab

        const maxHistory = 100
        const newHistory = [...tab.commandHistory]

        // Remove duplicate if it's the last command
        if (newHistory[newHistory.length - 1] === command) {
          return tab
        }

        newHistory.push(command)
        if (newHistory.length > maxHistory) {
          newHistory.shift()
        }

        return {
          ...tab,
          commandHistory: newHistory,
          historyIndex: -1,
        }
      }),
    )
  }, [])

  const clearTab = useCallback((tabId: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, lines: [] } : tab)))
  }, [])

  const updateSettings = useCallback((newSettings: Partial<TerminalSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }

      if (updated.fontSize < 8) updated.fontSize = 8
      if (updated.fontSize > 32) updated.fontSize = 32
      if (updated.opacity < 0.1) updated.opacity = 0.1
      if (updated.opacity > 1) updated.opacity = 1

      return updated
    })
  }, [])

  const removeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const filtered = prev.filter((tab) => tab.id !== tabId)
        if (filtered.length === 0) {
          // Always keep at least one tab
          return prev
        }

        // If removing active tab, switch to first available
        if (tabId === activeTab) {
          setActiveTab(filtered[0].id)
        }

        return filtered
      })
    },
    [activeTab],
  )

  const memoizedValues = useMemo(
    () => ({
      tabCount: tabs.length,
      hasMultipleTabs: tabs.length > 1,
      currentTabIndex: tabs.findIndex((tab) => tab.id === activeTab),
    }),
    [tabs.length, activeTab],
  )

  return {
    tabs,
    activeTab,
    setActiveTab,
    settings,
    getCurrentTab,
    addNewTab,
    removeTab,
    updateTabLines,
    updateTabHistory,
    clearTab,
    updateSettings,
    ...memoizedValues,
  }
}
