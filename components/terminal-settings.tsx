"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { X, Palette, Type, Eye, RotateCcw, Monitor } from "lucide-react"

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
  {
    value: "default",
    label: "Default",
    description: "System theme colors",
    colors: { bg: "bg-background", text: "text-foreground", preview: "bg-slate-500" },
  },
  {
    value: "matrix",
    label: "Matrix",
    description: "Classic green on black",
    colors: { bg: "bg-black", text: "text-green-400", preview: "bg-green-500" },
  },
  {
    value: "ocean",
    label: "Ocean",
    description: "Deep blue waters",
    colors: { bg: "bg-blue-950", text: "text-cyan-300", preview: "bg-cyan-500" },
  },
  {
    value: "sunset",
    label: "Sunset",
    description: "Warm orange glow",
    colors: { bg: "bg-orange-950", text: "text-orange-200", preview: "bg-orange-500" },
  },
  {
    value: "purple",
    label: "Purple Haze",
    description: "Royal purple theme",
    colors: { bg: "bg-purple-950", text: "text-purple-200", preview: "bg-purple-500" },
  },
  {
    value: "graphql",
    label: "GraphQL",
    description: "Pink developer theme",
    colors: { bg: "bg-pink-950", text: "text-pink-300", preview: "bg-pink-500" },
  },
  {
    value: "yaml",
    label: "YAML",
    description: "Indigo configuration",
    colors: { bg: "bg-indigo-950", text: "text-indigo-200", preview: "bg-indigo-500" },
  },
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

  const currentScheme = colorSchemes.find((s) => s.value === colorScheme) || colorSchemes[0]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-lg mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-semibold">Terminal Settings</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="theme-toggle" className="font-medium">
                  System Theme
                </Label>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <Label className="font-medium">Color Scheme</Label>
              <Badge variant="secondary" className="text-xs">
                {currentScheme.label}
              </Badge>
            </div>
            <Select value={colorScheme} onValueChange={onColorSchemeChange}>
              <SelectTrigger className="h-auto p-3">
                <SelectValue placeholder="Select color scheme">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${currentScheme.colors.preview} border-2 border-background shadow-sm`}
                    />
                    <div className="text-left">
                      <div className="font-medium">{currentScheme.label}</div>
                      <div className="text-xs text-muted-foreground">{currentScheme.description}</div>
                    </div>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorSchemes.map((scheme) => (
                  <SelectItem key={scheme.value} value={scheme.value} className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${scheme.colors.preview} border-2 border-background shadow-sm`}
                      />
                      <div>
                        <div className="font-medium">{scheme.label}</div>
                        <div className="text-xs text-muted-foreground">{scheme.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <Label className="font-medium">Font Size</Label>
              </div>
              <Badge variant="outline" className="font-mono">
                {fontSize}px
              </Badge>
            </div>
            <div className="px-3">
              <Slider
                value={[fontSize]}
                onValueChange={(value) => onFontSizeChange(value[0])}
                min={10}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10px</span>
                <span>24px</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border">
              <p className="font-mono text-center" style={{ fontSize: `${fontSize}px` }}>
                user@hyper-terminal:~$ echo "Preview text"
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <Label className="font-medium">Background Opacity</Label>
              </div>
              <Badge variant="outline">{Math.round(opacity * 100)}%</Badge>
            </div>
            <div className="px-3">
              <Slider
                value={[opacity]}
                onValueChange={(value) => onOpacityChange(value[0])}
                min={0.3}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>30%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-muted/50 transition-colors"
            onClick={() => {
              onFontSizeChange(14)
              onColorSchemeChange("default")
              onOpacityChange(1)
              setTheme("dark")
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
