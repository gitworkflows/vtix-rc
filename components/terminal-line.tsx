/**
 * Terminal Line Component with VT100 Support
 * Renders terminal lines with proper ANSI escape sequence formatting
 */

import type React from "react"
import { VT100Processor, type ProcessedText } from "./vt100-processor"

interface TerminalLineProps {
  content: string
  type: "command" | "output" | "error"
  colorScheme: string
}

export function TerminalLine({ content, type, colorScheme }: TerminalLineProps) {
  const processor = new VT100Processor()
  const segments = processor.processText(content)

  const getTypeClasses = () => {
    switch (type) {
      case "command":
        return "text-primary font-medium"
      case "error":
        return "text-destructive"
      default:
        return colorScheme === "default" ? "text-foreground" : "inherit"
    }
  }

  const getSegmentStyles = (segment: ProcessedText): React.CSSProperties => {
    const styles: React.CSSProperties = {}

    if (segment.styles.bold) styles.fontWeight = "bold"
    if (segment.styles.italic) styles.fontStyle = "italic"
    if (segment.styles.color) styles.color = segment.styles.color
    if (segment.styles.backgroundColor) styles.backgroundColor = segment.styles.backgroundColor

    let textDecoration = ""
    if (segment.styles.underline) textDecoration += "underline "
    if (segment.styles.strikethrough) textDecoration += "line-through "
    if (textDecoration) styles.textDecoration = textDecoration.trim()

    if (segment.styles.inverse) {
      const temp = styles.color || "inherit"
      styles.color = styles.backgroundColor || "inherit"
      styles.backgroundColor = temp
    }

    return styles
  }

  const getSegmentClasses = (segment: ProcessedText): string => {
    let classes = ""
    if (segment.styles.bold) classes += "font-bold "
    if (segment.styles.italic) classes += "italic "
    return classes.trim()
  }

  return (
    <div className={`flex animate-in slide-in-from-left-1 duration-100 ${getTypeClasses()}`}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={`transition-colors ${getSegmentClasses(segment)}`}
          style={getSegmentStyles(segment)}
        >
          {segment.text}
        </span>
      ))}
    </div>
  )
}
