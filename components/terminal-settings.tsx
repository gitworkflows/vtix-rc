"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { X } from "lucide-react"

interface TerminalSettingsProps {
  isOpen: boolean
  onClose: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  colorScheme: string
  onColorSchemeChange: (scheme: string) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
}

const colorSchemes = [
  { value: "default", label: "Default", colors: { bg: "bg-background", text: "text-foreground" } },
  { value: "matrix", label: "Matrix", colors: { bg: "bg-black", text: "text-green-400" } },
  { value: "ocean", label: "Ocean", colors: { bg: "bg-blue-950", text: "text-cyan-300" } },
  { value: "sunset", label: "Sunset", colors: { bg: "bg-orange-950", text: "text-orange-200" } },
  { value: "purple", label: "Purple Haze", colors: { bg: "bg-purple-950", text: "text-purple-200" } },
  { value: "graphql", label: "GraphQL", colors: { bg: "bg-pink-950", text: "text-pink-300" } },
  { value: "yaml", label: "YAML", colors: { bg: "bg-indigo-950", text: "text-indigo-200" } },
]

export function TerminalSettings({
  isOpen,
  onClose,
  fontSize,
  onFontSizeChange,
  colorScheme,
  onColorSchemeChange,
  opacity,
  onOpacityChange,
}: TerminalSettingsProps) {
  const { theme, setTheme } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Terminal Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle">Dark Mode</Label>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label>Color Scheme</Label>
            <Select value={colorScheme} onValueChange={onColorSchemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select color scheme" />
              </SelectTrigger>
              <SelectContent>
                {colorSchemes.map((scheme) => (
                  <SelectItem key={scheme.value} value={scheme.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scheme.colors.bg} border`} />
                      {scheme.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label>Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => onFontSizeChange(value[0])}
              min={10}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <Label>Background Opacity: {Math.round(opacity * 100)}%</Label>
            <Slider
              value={[opacity]}
              onValueChange={(value) => onOpacityChange(value[0])}
              min={0.3}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              onFontSizeChange(14)
              onColorSchemeChange("default")
              onOpacityChange(1)
              setTheme("dark")
            }}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
