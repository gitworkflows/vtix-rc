"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Maximize2, Minimize2, X, Settings, Plus, TerminalIcon } from "lucide-react"

interface TerminalHeaderProps {
  currentShellName: string
  onAddTab: () => void
  onOpenSettings: () => void
  isMaximized: boolean
  onToggleMaximize: () => void
  onClose?: () => void
}

export function TerminalHeader({
  currentShellName,
  onAddTab,
  onOpenSettings,
  isMaximized,
  onToggleMaximize,
  onClose,
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" />
        </div>

        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Hyper Terminal</span>
        </div>

        <Badge variant="secondary" className="text-xs font-mono">
          {currentShellName}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTab}
          className="hover:bg-primary/10 transition-colors"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          className="hover:bg-primary/10 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMaximize}
          className="hover:bg-primary/10 transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
