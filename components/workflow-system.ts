export interface WorkflowArgument {
  name: string
  description?: string
  default_value?: string
}

export interface Workflow {
  name: string
  command: string
  tags?: string[]
  description?: string
  source_url?: string
  author?: string
  author_url?: string
  shells?: ("bash" | "zsh" | "fish" | "powershell")[]
  args?: WorkflowArgument[]
}

export interface Base16Theme {
  accent: string
  background: string
  details: string
  foreground: string
  terminal_colors: {
    bright: {
      black: string
      blue: string
      cyan: string
      green: string
      magenta: string
      red: string
      white: string
      yellow: string
    }
    normal: {
      black: string
      blue: string
      cyan: string
      green: string
      magenta: string
      red: string
      white: string
      yellow: string
    }
  }
}

export class WorkflowSystem {
  private workflows: Map<string, Workflow> = new Map()
  private themes: Map<string, Base16Theme> = new Map()

  constructor() {
    this.loadDefaultWorkflows()
    this.loadDefaultThemes()
  }

  private loadDefaultWorkflows() {
    const defaultWorkflows: Workflow[] = [
      {
        name: "Git Status",
        command: "git status",
        tags: ["git", "version-control"],
        description: "Show the working tree status",
        shells: ["bash", "zsh", "fish"],
      },
      {
        name: "List Files Detailed",
        command: "ls -la {{directory}}",
        tags: ["filesystem", "list"],
        description: "List all files in directory with detailed information",
        args: [
          {
            name: "directory",
            description: "Directory to list files from",
            default_value: ".",
          },
        ],
      },
      {
        name: "Find Files",
        command: "find {{path}} -name '{{pattern}}'",
        tags: ["search", "filesystem"],
        description: "Find files matching a pattern",
        args: [
          {
            name: "path",
            description: "Path to search in",
            default_value: ".",
          },
          {
            name: "pattern",
            description: "File pattern to search for",
            default_value: "*.txt",
          },
        ],
      },
      {
        name: "Docker List Containers",
        command: "docker ps {{flags}}",
        tags: ["docker", "containers"],
        description: "List Docker containers",
        args: [
          {
            name: "flags",
            description: "Docker ps flags",
            default_value: "-a",
          },
        ],
      },
    ]

    defaultWorkflows.forEach((workflow) => {
      this.workflows.set(workflow.name.toLowerCase(), workflow)
    })
  }

  private loadDefaultThemes() {
    const asamTheme: Base16Theme = {
      accent: "#fff024",
      background: "#080808",
      details: "darker",
      foreground: "#5bee00",
      terminal_colors: {
        bright: {
          black: "#008751",
          blue: "#ab5236",
          cyan: "#ffccaa",
          green: "#1d2b53",
          magenta: "#c2c3c7",
          red: "#ffa300",
          white: "#fff1e8",
          yellow: "#7e2553",
        },
        normal: {
          black: "#000000",
          blue: "#83769c",
          cyan: "#29adff",
          green: "#00e756",
          magenta: "#ff77a8",
          red: "#ff004d",
          white: "#5f574f",
          yellow: "#fff024",
        },
      },
    }

    this.themes.set("asam", asamTheme)
  }

  parseYamlWorkflow(yamlContent: string): Workflow | null {
    try {
      // Simple YAML parser for workflow format
      const lines = yamlContent.split("\n")
      const workflow: Partial<Workflow> = {}
      const workflowArgs: WorkflowArgument[] = []

      let currentSection = ""
      let currentArgument: Partial<WorkflowArgument> = {}

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue

        if (trimmed === "arguments:") {
          currentSection = "arguments"
          continue
        }

        if (trimmed.startsWith("- name:")) {
          if (currentArgument.name) {
            workflowArgs.push(currentArgument as WorkflowArgument)
          }
          currentArgument = { name: trimmed.split("name:")[1].trim() }
          continue
        }

        if (currentSection === "arguments" && trimmed.includes(":")) {
          const [key, value] = trimmed.split(":").map((s) => s.trim())
          if (key === "description") {
            currentArgument.description = value.replace(/['"]/g, "")
          } else if (key === "default_value") {
            currentArgument.default_value = value.replace(/['"]/g, "")
          }
          continue
        }

        if (trimmed.includes(":") && currentSection !== "arguments") {
          const [key, value] = trimmed.split(":").map((s) => s.trim())
          const cleanValue = value.replace(/['"]/g, "")

          switch (key) {
            case "name":
              workflow.name = cleanValue
              break
            case "command":
              workflow.command = cleanValue
              break
            case "description":
              workflow.description = cleanValue
              break
            case "tags":
              workflow.tags = cleanValue
                .replace(/[[\]]/g, "")
                .split(",")
                .map((s) => s.trim().replace(/['"]/g, ""))
              break
            case "shells":
              workflow.shells = cleanValue
                .replace(/[[\]]/g, "")
                .split(",")
                .map((s) => s.trim().replace(/['"]/g, "")) as any
              break
          }
        }
      }

      if (currentArgument.name) {
        workflowArgs.push(currentArgument as WorkflowArgument)
      }

      if (workflowArgs.length > 0) {
        workflow.args = workflowArgs
      }

      return workflow.name && workflow.command ? (workflow as Workflow) : null
    } catch (error) {
      console.error("[v0] Error parsing YAML workflow:", error)
      return null
    }
  }

  parseYamlTheme(yamlContent: string): Base16Theme | null {
    try {
      // Simple YAML parser for theme format
      const lines = yamlContent.split("\n")
      const theme: Partial<Base16Theme> = {
        terminal_colors: { bright: {} as any, normal: {} as any },
      }

      let currentSection = ""
      let currentColorType = ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue

        if (trimmed === "terminal_colors:") {
          currentSection = "terminal_colors"
          continue
        }

        if (trimmed === "bright:" && currentSection === "terminal_colors") {
          currentColorType = "bright"
          continue
        }

        if (trimmed === "normal:" && currentSection === "terminal_colors") {
          currentColorType = "normal"
          continue
        }

        if (trimmed.includes(":")) {
          const [key, value] = trimmed.split(":").map((s) => s.trim())
          const cleanValue = value.replace(/['"]/g, "")

          if (currentSection === "terminal_colors" && currentColorType) {
            if (!theme.terminal_colors) {
              theme.terminal_colors = { bright: {} as any, normal: {} as any }
            }
            ;(theme.terminal_colors as any)[currentColorType][key] = cleanValue
          } else {
            switch (key) {
              case "accent":
                theme.accent = cleanValue
                break
              case "background":
                theme.background = cleanValue
                break
              case "details":
                theme.details = cleanValue
                break
              case "foreground":
                theme.foreground = cleanValue
                break
            }
          }
        }
      }

      return theme.accent && theme.background && theme.foreground ? (theme as Base16Theme) : null
    } catch (error) {
      console.error("[v0] Error parsing YAML theme:", error)
      return null
    }
  }

  addWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.name.toLowerCase(), workflow)
  }

  addTheme(name: string, theme: Base16Theme): void {
    this.themes.set(name.toLowerCase(), theme)
  }

  getWorkflow(name: string): Workflow | undefined {
    return this.workflows.get(name.toLowerCase())
  }

  getTheme(name: string): Base16Theme | undefined {
    return this.themes.get(name.toLowerCase())
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values())
  }

  listThemes(): string[] {
    return Array.from(this.themes.keys())
  }

  searchWorkflows(query: string): Workflow[] {
    const lowerQuery = query.toLowerCase()
    return this.listWorkflows().filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(lowerQuery) ||
        workflow.description?.toLowerCase().includes(lowerQuery) ||
        workflow.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    )
  }

  executeWorkflow(workflow: Workflow, args: Record<string, string> = {}): string {
    let command = workflow.command

    // Replace arguments in command
    if (workflow.args) {
      for (const arg of workflow.args) {
        const value = args[arg.name] || arg.default_value || arg.name
        const placeholder = `{{${arg.name}}}`
        command = command.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value)
      }
    }

    return command
  }

  getThemeCSS(theme: Base16Theme): string {
    return `
      --terminal-bg: ${theme.background};
      --terminal-fg: ${theme.foreground};
      --terminal-accent: ${theme.accent};
      --terminal-black: ${theme.terminal_colors.normal.black};
      --terminal-red: ${theme.terminal_colors.normal.red};
      --terminal-green: ${theme.terminal_colors.normal.green};
      --terminal-yellow: ${theme.terminal_colors.normal.yellow};
      --terminal-blue: ${theme.terminal_colors.normal.blue};
      --terminal-magenta: ${theme.terminal_colors.normal.magenta};
      --terminal-cyan: ${theme.terminal_colors.normal.cyan};
      --terminal-white: ${theme.terminal_colors.normal.white};
      --terminal-bright-black: ${theme.terminal_colors.bright.black};
      --terminal-bright-red: ${theme.terminal_colors.bright.red};
      --terminal-bright-green: ${theme.terminal_colors.bright.green};
      --terminal-bright-yellow: ${theme.terminal_colors.bright.yellow};
      --terminal-bright-blue: ${theme.terminal_colors.bright.blue};
      --terminal-bright-magenta: ${theme.terminal_colors.bright.magenta};
      --terminal-bright-cyan: ${theme.terminal_colors.bright.cyan};
      --terminal-bright-white: ${theme.terminal_colors.bright.white};
    `
  }
}
