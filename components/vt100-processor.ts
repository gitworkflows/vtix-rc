/**
 * VT100/ANSI Escape Sequence Processor
 * Handles terminal control sequences for text styling, cursor movement, and screen control
 */

export interface VT100State {
  cursorX: number
  cursorY: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  foregroundColor: string | null
  backgroundColor: string | null
  inverse: boolean
}

export interface ProcessedText {
  text: string
  styles: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    color?: string
    backgroundColor?: string
    inverse?: boolean
  }
}

export class VT100Processor {
  private state: VT100State = {
    cursorX: 0,
    cursorY: 0,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    foregroundColor: null,
    backgroundColor: null,
    inverse: false,
  }

  private readonly colorMap: Record<number, string> = {
    30: "#000000", // Black
    31: "#ff0000", // Red
    32: "#00ff00", // Green
    33: "#ffff00", // Yellow
    34: "#0000ff", // Blue
    35: "#ff00ff", // Magenta
    36: "#00ffff", // Cyan
    37: "#ffffff", // White
    90: "#808080", // Bright Black (Gray)
    91: "#ff8080", // Bright Red
    92: "#80ff80", // Bright Green
    93: "#ffff80", // Bright Yellow
    94: "#8080ff", // Bright Blue
    95: "#ff80ff", // Bright Magenta
    96: "#80ffff", // Bright Cyan
    97: "#ffffff", // Bright White
  }

  /**
   * Process text containing ANSI escape sequences
   */
  processText(input: string): ProcessedText[] {
    const segments: ProcessedText[] = []
    let currentText = ""
    let i = 0

    while (i < input.length) {
      if (input[i] === "\x1b" && input[i + 1] === "[") {
        // Save current text segment if any
        if (currentText) {
          segments.push({
            text: currentText,
            styles: this.getCurrentStyles(),
          })
          currentText = ""
        }

        // Find end of escape sequence
        let j = i + 2
        while (j < input.length && !/[a-zA-Z]/.test(input[j])) {
          j++
        }

        if (j < input.length) {
          const sequence = input.slice(i + 2, j + 1)
          this.processEscapeSequence(sequence)
          i = j + 1
        } else {
          i++
        }
      } else {
        currentText += input[i]
        i++
      }
    }

    // Add final text segment
    if (currentText) {
      segments.push({
        text: currentText,
        styles: this.getCurrentStyles(),
      })
    }

    return segments
  }

  /**
   * Process individual escape sequence
   */
  private processEscapeSequence(sequence: string): void {
    const command = sequence.slice(-1)
    const params = sequence
      .slice(0, -1)
      .split(";")
      .map((p) => Number.parseInt(p) || 0)

    switch (command) {
      case "m": // SGR (Select Graphic Rendition)
        this.processSGR(params)
        break
      case "H": // CUP (Cursor Position)
      case "f": // HVP (Horizontal and Vertical Position)
        this.state.cursorY = (params[0] || 1) - 1
        this.state.cursorX = (params[1] || 1) - 1
        break
      case "A": // CUU (Cursor Up)
        this.state.cursorY = Math.max(0, this.state.cursorY - (params[0] || 1))
        break
      case "B": // CUD (Cursor Down)
        this.state.cursorY += params[0] || 1
        break
      case "C": // CUF (Cursor Forward)
        this.state.cursorX += params[0] || 1
        break
      case "D": // CUB (Cursor Back)
        this.state.cursorX = Math.max(0, this.state.cursorX - (params[0] || 1))
        break
      case "J": // ED (Erase in Display)
        // Handle screen clearing
        break
      case "K": // EL (Erase in Line)
        // Handle line clearing
        break
    }
  }

  /**
   * Process SGR (Select Graphic Rendition) parameters
   */
  private processSGR(params: number[]): void {
    if (params.length === 0) params = [0]

    for (const param of params) {
      switch (param) {
        case 0: // Reset
          this.resetState()
          break
        case 1: // Bold
          this.state.bold = true
          break
        case 3: // Italic
          this.state.italic = true
          break
        case 4: // Underline
          this.state.underline = true
          break
        case 7: // Inverse
          this.state.inverse = true
          break
        case 9: // Strikethrough
          this.state.strikethrough = true
          break
        case 22: // Normal intensity (not bold)
          this.state.bold = false
          break
        case 23: // Not italic
          this.state.italic = false
          break
        case 24: // Not underlined
          this.state.underline = false
          break
        case 27: // Not inverse
          this.state.inverse = false
          break
        case 29: // Not strikethrough
          this.state.strikethrough = false
          break
        case 39: // Default foreground color
          this.state.foregroundColor = null
          break
        case 49: // Default background color
          this.state.backgroundColor = null
          break
        default:
          if (param >= 30 && param <= 37) {
            // Standard foreground colors
            this.state.foregroundColor = this.colorMap[param]
          } else if (param >= 40 && param <= 47) {
            // Standard background colors
            this.state.backgroundColor = this.colorMap[param - 10]
          } else if (param >= 90 && param <= 97) {
            // Bright foreground colors
            this.state.foregroundColor = this.colorMap[param]
          } else if (param >= 100 && param <= 107) {
            // Bright background colors
            this.state.backgroundColor = this.colorMap[param - 10]
          }
          break
      }
    }
  }

  /**
   * Get current text styles
   */
  private getCurrentStyles(): ProcessedText["styles"] {
    const styles: ProcessedText["styles"] = {}

    if (this.state.bold) styles.bold = true
    if (this.state.italic) styles.italic = true
    if (this.state.underline) styles.underline = true
    if (this.state.strikethrough) styles.strikethrough = true
    if (this.state.inverse) styles.inverse = true
    if (this.state.foregroundColor) styles.color = this.state.foregroundColor
    if (this.state.backgroundColor) styles.backgroundColor = this.state.backgroundColor

    return styles
  }

  /**
   * Reset all formatting state
   */
  private resetState(): void {
    this.state.bold = false
    this.state.italic = false
    this.state.underline = false
    this.state.strikethrough = false
    this.state.inverse = false
    this.state.foregroundColor = null
    this.state.backgroundColor = null
  }

  /**
   * Generate common ANSI sequences for testing
   */
  static generateTestSequences(): string[] {
    return [
      "\x1b[1mBold text\x1b[0m",
      "\x1b[3mItalic text\x1b[0m",
      "\x1b[4mUnderlined text\x1b[0m",
      "\x1b[31mRed text\x1b[0m",
      "\x1b[32mGreen text\x1b[0m",
      "\x1b[33mYellow text\x1b[0m",
      "\x1b[34mBlue text\x1b[0m",
      "\x1b[35mMagenta text\x1b[0m",
      "\x1b[36mCyan text\x1b[0m",
      "\x1b[1;31mBold Red text\x1b[0m",
      "\x1b[42mGreen background\x1b[0m",
      "\x1b[7mInverse text\x1b[0m",
    ]
  }
}
