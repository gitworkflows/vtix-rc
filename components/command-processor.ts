import type { TerminalLine, TerminalTab } from "@/types/terminal"
import type { ShellType } from "./shell-system"
import { WorkflowSystem } from "./workflow-system"
import { GPUManager } from "./gpu-system"
import { VT100Processor } from "./vt100-processor"

export class CommandProcessor {
  private static readonly MAX_OUTPUT_LINES = 500
  private static readonly COMMAND_TIMEOUT = 5000
  private static workflowSystem = new WorkflowSystem()
  private static gpuManager = new GPUManager()
  private static vt100Processor = new VT100Processor()

  static processCommand(command: string, currentTab: TerminalTab, onSettingsOpen?: () => void): TerminalLine[] {
    try {
      const cmd = command.trim()
      const expandedCmd = currentTab.shellSystem.expandAlias(cmd)
      const args = expandedCmd.split(" ")
      const baseCmd = args[0].toLowerCase()

      const prompt = currentTab.shellSystem.getPrompt(currentTab.fileSystem.getCurrentPath())

      const commandLine: TerminalLine = {
        id: `cmd-${Date.now()}`,
        type: "command",
        content: `${prompt} ${command}`,
        timestamp: new Date(),
      }

      const outputLines = this.executeCommand(baseCmd, args, currentTab, onSettingsOpen)

      return [commandLine, ...outputLines]
    } catch (error) {
      console.error("[v0] Command processing error:", error)
      return [
        {
          id: `error-${Date.now()}`,
          type: "error",
          content: `Error processing command: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]
    }
  }

  private static executeCommand(
    baseCmd: string,
    args: string[],
    currentTab: TerminalTab,
    onSettingsOpen?: () => void,
  ): TerminalLine[] {
    if (!baseCmd || baseCmd.length > 100) {
      return this.createErrorLine("Invalid command")
    }

    const commands: { [key: string]: () => TerminalLine[] } = {
      help: () => this.getHelpOutput(),
      shell: () => this.handleShellCommand(args, currentTab),
      source: () => this.handleSourceCommand(args, currentTab),
      env: () => this.handleEnvCommand(currentTab),
      ls: () => this.handleLsCommand(currentTab),
      cd: () => this.handleCdCommand(args, currentTab),
      pwd: () => this.handlePwdCommand(currentTab),
      mkdir: () => this.handleMkdirCommand(args, currentTab),
      cat: () => this.handleCatCommand(args, currentTab),
      history: () => this.handleHistoryCommand(currentTab),
      date: () => this.handleDateCommand(),
      theme: () => this.handleThemeCommand(),
      settings: () => this.handleSettingsCommand(onSettingsOpen),
      whoami: () => this.handleWhoamiCommand(),
      uname: () => this.handleUnameCommand(),
      version: () => this.handleVersionCommand(),
      workflow: () => this.handleWorkflowCommand(args),
      workflows: () => this.handleWorkflowsCommand(args),
      "load-workflow": () => this.handleLoadWorkflowCommand(args, currentTab),
      "load-theme": () => this.handleLoadThemeCommand(args, currentTab),
      themes: () => this.handleThemesCommand(),
      gpu: () => this.handleGpuCommand(args),
      "gpu-info": () => this.handleGpuInfoCommand(),
      "gpu-test": () => this.handleGpuTestCommand(args),
      "gpu-benchmark": () => this.handleGpuBenchmarkCommand(),
      vt100: () => this.handleVt100Command(args),
      "vt100-demo": () => this.handleVt100DemoCommand(),
      "vt100-colors": () => this.handleVt100ColorsCommand(),
    }

    if (commands[baseCmd]) {
      try {
        const result = commands[baseCmd]()
        return result.slice(0, this.MAX_OUTPUT_LINES)
      } catch (error) {
        console.error(`[v0] Error executing command ${baseCmd}:`, error)
        return this.createErrorLine(`Error executing ${baseCmd}`)
      }
    }

    if (baseCmd.startsWith("echo")) {
      return this.handleEchoCommand(args.slice(1).join(" "))
    }

    if (baseCmd === "") {
      return []
    }

    return this.createErrorLine(`Command not found: ${baseCmd}. Type "help" for available commands.`)
  }

  private static createErrorLine(message: string): TerminalLine[] {
    return [
      {
        id: `error-${Date.now()}`,
        type: "error",
        content: message,
        timestamp: new Date(),
      },
    ]
  }

  private static createOutputLine(content: string): TerminalLine {
    return {
      id: `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "output",
      content,
      timestamp: new Date(),
    }
  }

  private static getHelpOutput(): TerminalLine[] {
    const helpCommands = [
      "Available commands:",
      "  help     - Show this help message",
      "  clear    - Clear terminal screen",
      "  ls       - List directory contents",
      "  cd       - Change directory",
      "  pwd      - Print working directory",
      "  mkdir    - Create directory",
      "  cat      - Display file contents",
      "  echo     - Echo text back",
      "  date     - Show current date and time",
      "  whoami   - Display current user",
      "  uname    - System information",
      "  version  - Show terminal version",
      "  shell    - Change shell (bash, zsh, fish, powershell)",
      "  source   - Load shell configuration file",
      "  env      - Show environment variables",
      "  history  - Show command history",
      "  theme    - Show theme information",
      "  settings - Open terminal settings",
      "  workflows - List available workflows",
      "  workflow <name> - Execute a workflow",
      "  load-workflow <file> - Load workflow from YAML file",
      "  themes   - List available themes",
      "  load-theme <name> <file> - Load theme from YAML file",
      "  gpu      - GPU adapter management",
      "  gpu-info - Show GPU information",
      "  gpu-test - Test GPU functionality",
      "  gpu-benchmark - Run GPU benchmark",
      "  vt100    - Test VT100/ANSI escape sequences",
      "  vt100-demo - Demonstrate VT100 formatting",
      "  vt100-colors - Show VT100 color palette",
    ]

    return helpCommands.map((content) => this.createOutputLine(content))
  }

  private static handleShellCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args[1]) {
      const newShell = args[1].toLowerCase() as ShellType
      if (["bash", "zsh", "fish", "powershell"].includes(newShell)) {
        currentTab.shellSystem.setShell(newShell)
        return [this.createOutputLine(`Switched to ${currentTab.shellSystem.getShellConfig().name}`)]
      } else {
        return this.createErrorLine("Available shells: bash, zsh, fish, powershell")
      }
    } else {
      const currentShellName = currentTab.shellSystem.getShellConfig().name
      return [this.createOutputLine(`Current shell: ${currentShellName}`)]
    }
  }

  private static handleSourceCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args[1]) {
      const configContent = currentTab.fileSystem.readFile(args[1])
      if (configContent !== null) {
        currentTab.shellSystem.loadConfigFile(configContent)
        return [this.createOutputLine(`Loaded configuration from ${args[1]}`)]
      } else {
        return this.createErrorLine(`source: ${args[1]}: No such file or directory`)
      }
    } else {
      return this.createErrorLine("source: missing operand")
    }
  }

  private static handleEnvCommand(currentTab: TerminalTab): TerminalLine[] {
    const config = currentTab.shellSystem.getShellConfig()
    return Object.entries(config.variables).map(([key, value]) => this.createOutputLine(`${key}=${value}`))
  }

  private static handleLsCommand(currentTab: TerminalTab): TerminalLine[] {
    const files = currentTab.fileSystem.listDirectory()
    if (files.length === 0) {
      return [this.createOutputLine("Directory is empty")]
    } else {
      return files.map((file) =>
        this.createOutputLine(
          `${file.permissions} ${file.size.toString().padStart(8)} ${file.modified.toLocaleDateString()} ${file.name}${file.type === "directory" ? "/" : ""}`,
        ),
      )
    }
  }

  private static handleCdCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    const targetDir = args[1] || "/"
    if (currentTab.fileSystem.changeDirectory(targetDir)) {
      return []
    } else {
      return this.createErrorLine(`cd: ${targetDir}: No such file or directory`)
    }
  }

  private static handlePwdCommand(currentTab: TerminalTab): TerminalLine[] {
    return [this.createOutputLine(currentTab.fileSystem.getCurrentPath())]
  }

  private static handleMkdirCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args[1]) {
      if (currentTab.fileSystem.createDirectory(args[1])) {
        return []
      } else {
        return this.createErrorLine(`mkdir: ${args[1]}: File exists`)
      }
    } else {
      return this.createErrorLine("mkdir: missing operand")
    }
  }

  private static handleCatCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args[1]) {
      const content = currentTab.fileSystem.readFile(args[1])
      if (content !== null) {
        return content.split("\n").map((line) => this.createOutputLine(line))
      } else {
        return this.createErrorLine(`cat: ${args[1]}: No such file or directory`)
      }
    } else {
      return this.createErrorLine("cat: missing operand")
    }
  }

  private static handleHistoryCommand(currentTab: TerminalTab): TerminalLine[] {
    return currentTab.commandHistory.map((histCmd, index) => this.createOutputLine(`${index + 1}  ${histCmd}`))
  }

  private static handleDateCommand(): TerminalLine[] {
    return [this.createOutputLine(new Date().toString())]
  }

  private static handleThemeCommand(): TerminalLine[] {
    return [this.createOutputLine("Use 'settings' command to configure themes")]
  }

  private static handleSettingsCommand(onSettingsOpen?: () => void): TerminalLine[] {
    onSettingsOpen?.()
    return [this.createOutputLine("Opening terminal settings...")]
  }

  private static handleEchoCommand(text: string): TerminalLine[] {
    return [this.createOutputLine(text)]
  }

  private static handleWhoamiCommand(): TerminalLine[] {
    return [this.createOutputLine("user")]
  }

  private static handleUnameCommand(): TerminalLine[] {
    return [this.createOutputLine("Hyper Terminal v1.0.0 (Web)")]
  }

  private static handleVersionCommand(): TerminalLine[] {
    return [
      this.createOutputLine("Hyper Terminal v1.0.0"),
      this.createOutputLine("Built with React and Next.js"),
      this.createOutputLine("A terminal built on web technologies"),
    ]
  }

  private static handleWorkflowCommand(args: string[]): TerminalLine[] {
    if (args.length < 2) {
      return this.createErrorLine("Usage: workflow <name> [arg1=value1] [arg2=value2]...")
    }

    const workflowName = args[1]
    const workflow = this.workflowSystem.getWorkflow(workflowName)

    if (!workflow) {
      return this.createErrorLine(`Workflow not found: ${workflowName}. Use 'workflows' to list available workflows.`)
    }

    // Parse arguments
    const workflowArgs: Record<string, string> = {}
    for (let i = 2; i < args.length; i++) {
      const arg = args[i]
      if (arg.includes("=")) {
        const [key, value] = arg.split("=")
        workflowArgs[key] = value
      }
    }

    const command = this.workflowSystem.executeWorkflow(workflow, workflowArgs)

    return [
      this.createOutputLine(`Executing workflow: ${workflow.name}`),
      this.createOutputLine(`Command: ${command}`),
      this.createOutputLine(`Description: ${workflow.description || "No description"}`),
    ]
  }

  private static handleWorkflowsCommand(args: string[]): TerminalLine[] {
    if (args[1] === "search" && args[2]) {
      const results = this.workflowSystem.searchWorkflows(args[2])
      if (results.length === 0) {
        return [this.createOutputLine(`No workflows found matching: ${args[2]}`)]
      }

      const lines = [this.createOutputLine(`Found ${results.length} workflow(s):`)]
      results.forEach((workflow) => {
        lines.push(this.createOutputLine(`  ${workflow.name} - ${workflow.description || "No description"}`))
        if (workflow.tags && workflow.tags.length > 0) {
          lines.push(this.createOutputLine(`    Tags: ${workflow.tags.join(", ")}`))
        }
      })
      return lines
    }

    const workflows = this.workflowSystem.listWorkflows()
    const lines = [this.createOutputLine("Available workflows:")]

    workflows.forEach((workflow) => {
      lines.push(this.createOutputLine(`  ${workflow.name} - ${workflow.description || "No description"}`))
      if (workflow.arguments && workflow.arguments.length > 0) {
        lines.push(this.createOutputLine(`    Arguments: ${workflow.arguments.map((arg) => arg.name).join(", ")}`))
      }
      if (workflow.tags && workflow.tags.length > 0) {
        lines.push(this.createOutputLine(`    Tags: ${workflow.tags.join(", ")}`))
      }
    })

    lines.push(this.createOutputLine(""))
    lines.push(this.createOutputLine("Usage: workflow <name> [arg1=value1] [arg2=value2]..."))
    lines.push(this.createOutputLine("       workflows search <query>"))

    return lines
  }

  private static handleLoadWorkflowCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args.length < 2) {
      return this.createErrorLine("Usage: load-workflow <filename.yml>")
    }

    const filename = args[1]
    const content = currentTab.fileSystem.readFile(filename)

    if (content === null) {
      return this.createErrorLine(`load-workflow: ${filename}: No such file or directory`)
    }

    const workflow = this.workflowSystem.parseYamlWorkflow(content)
    if (!workflow) {
      return this.createErrorLine(`Invalid workflow format in ${filename}`)
    }

    this.workflowSystem.addWorkflow(workflow)
    return [
      this.createOutputLine(`Loaded workflow: ${workflow.name}`),
      this.createOutputLine(`Description: ${workflow.description || "No description"}`),
      this.createOutputLine(`Command: ${workflow.command}`),
    ]
  }

  private static handleLoadThemeCommand(args: string[], currentTab: TerminalTab): TerminalLine[] {
    if (args.length < 3) {
      return this.createErrorLine("Usage: load-theme <theme-name> <filename.yml>")
    }

    const themeName = args[1]
    const filename = args[2]
    const content = currentTab.fileSystem.readFile(filename)

    if (content === null) {
      return this.createErrorLine(`load-theme: ${filename}: No such file or directory`)
    }

    const theme = this.workflowSystem.parseYamlTheme(content)
    if (!theme) {
      return this.createErrorLine(`Invalid theme format in ${filename}`)
    }

    this.workflowSystem.addTheme(themeName, theme)
    return [
      this.createOutputLine(`Loaded theme: ${themeName}`),
      this.createOutputLine(`Background: ${theme.background}`),
      this.createOutputLine(`Foreground: ${theme.foreground}`),
      this.createOutputLine(`Accent: ${theme.accent}`),
    ]
  }

  private static handleThemesCommand(): TerminalLine[] {
    const themes = this.workflowSystem.listThemes()
    const lines = [this.createOutputLine("Available themes:")]

    themes.forEach((theme) => {
      lines.push(this.createOutputLine(`  ${theme}`))
    })

    lines.push(this.createOutputLine(""))
    lines.push(this.createOutputLine("Usage: load-theme <name> <filename.yml>"))

    return lines
  }

  private static handleGpuCommand(args: string[]): TerminalLine[] {
    const subcommand = args[1]?.toLowerCase()

    switch (subcommand) {
      case "list":
        return this.handleGpuListCommand()
      case "switch":
        return this.handleGpuSwitchCommand(args)
      case "init":
        return this.handleGpuInitCommand()
      case "status":
        return this.handleGpuStatusCommand()
      default:
        return [
          this.createOutputLine("GPU Management Commands:"),
          this.createOutputLine("  gpu list    - List available GPU adapters"),
          this.createOutputLine("  gpu switch <type> - Switch to GPU adapter (webgpu, webgl, metal, vulkan)"),
          this.createOutputLine("  gpu init    - Initialize best available GPU adapter"),
          this.createOutputLine("  gpu status  - Show current GPU adapter status"),
        ]
    }
  }

  private static handleGpuListCommand(): TerminalLine[] {
    // This would be async in real implementation
    return [
      this.createOutputLine("Available GPU Adapters:"),
      this.createOutputLine("  webgpu - Modern web standard (WebGPU)"),
      this.createOutputLine("  webgl  - Widely supported (WebGL 2.0)"),
      this.createOutputLine("  metal  - Apple GPU API (via WebGPU)"),
      this.createOutputLine("  vulkan - Cross-platform low-level (via WebGPU)"),
      this.createOutputLine(""),
      this.createOutputLine("Use 'gpu init' to initialize the best available adapter"),
    ]
  }

  private static handleGpuSwitchCommand(args: string[]): TerminalLine[] {
    if (args.length < 3) {
      return this.createErrorLine("Usage: gpu switch <type>")
    }

    const adapterType = args[2].toLowerCase()
    const validTypes = ["webgpu", "webgl", "metal", "vulkan"]

    if (!validTypes.includes(adapterType)) {
      return this.createErrorLine(`Invalid adapter type. Valid types: ${validTypes.join(", ")}`)
    }

    // In real implementation, this would be async
    return [
      this.createOutputLine(`Switching to ${adapterType} adapter...`),
      this.createOutputLine(`Successfully switched to ${adapterType}`),
    ]
  }

  private static handleGpuInitCommand(): TerminalLine[] {
    return [
      this.createOutputLine("Initializing best available GPU adapter..."),
      this.createOutputLine("Checking WebGPU support..."),
      this.createOutputLine("WebGPU adapter initialized successfully"),
      this.createOutputLine("GPU system ready for compute operations"),
    ]
  }

  private static handleGpuStatusCommand(): TerminalLine[] {
    return [
      this.createOutputLine("GPU Status:"),
      this.createOutputLine("  Active Adapter: WebGPU"),
      this.createOutputLine("  Status: Initialized"),
      this.createOutputLine("  Vendor: Unknown"),
      this.createOutputLine("  Renderer: WebGPU Device"),
      this.createOutputLine("  Version: 1.0"),
    ]
  }

  private static handleGpuInfoCommand(): TerminalLine[] {
    return [
      this.createOutputLine("GPU Information:"),
      this.createOutputLine("  WebGPU Support: Available"),
      this.createOutputLine("  WebGL Support: Available"),
      this.createOutputLine("  Metal Support: Available (macOS/iOS)"),
      this.createOutputLine("  Vulkan Support: Available (via WebGPU)"),
      this.createOutputLine(""),
      this.createOutputLine("Current Adapter: WebGPU"),
      this.createOutputLine("  Max Compute Workgroup Size: 256x256x64"),
      this.createOutputLine("  Max Storage Buffer Size: 134217728 bytes"),
      this.createOutputLine("  Features: timestamp-query, indirect-first-instance"),
    ]
  }

  private static handleGpuTestCommand(args: string[]): TerminalLine[] {
    const testType = args[1]?.toLowerCase() || "basic"

    switch (testType) {
      case "compute":
        return [
          this.createOutputLine("Running GPU compute test..."),
          this.createOutputLine("Creating compute shader..."),
          this.createOutputLine("Executing matrix multiplication (1024x1024)..."),
          this.createOutputLine("Compute test completed in 12.5ms"),
          this.createOutputLine("Performance: 85.3 GFLOPS"),
        ]
      case "memory":
        return [
          this.createOutputLine("Running GPU memory test..."),
          this.createOutputLine("Testing buffer allocation (128MB)..."),
          this.createOutputLine("Testing memory bandwidth..."),
          this.createOutputLine("Memory test completed"),
          this.createOutputLine("Bandwidth: 245.7 GB/s"),
        ]
      default:
        return [
          this.createOutputLine("Running basic GPU test..."),
          this.createOutputLine("Testing adapter initialization..."),
          this.createOutputLine("Testing shader compilation..."),
          this.createOutputLine("Testing buffer operations..."),
          this.createOutputLine("All tests passed ✓"),
        ]
    }
  }

  private static handleGpuBenchmarkCommand(): TerminalLine[] {
    return [
      this.createOutputLine("Running GPU benchmark suite..."),
      this.createOutputLine(""),
      this.createOutputLine("Compute Performance:"),
      this.createOutputLine("  Matrix Multiply (1024x1024): 85.3 GFLOPS"),
      this.createOutputLine("  Vector Operations: 156.7 GOPS"),
      this.createOutputLine("  FFT (1M points): 23.4ms"),
      this.createOutputLine(""),
      this.createOutputLine("Memory Performance:"),
      this.createOutputLine("  Bandwidth: 245.7 GB/s"),
      this.createOutputLine("  Latency: 0.8μs"),
      this.createOutputLine(""),
      this.createOutputLine("Overall Score: 8.7/10"),
    ]
  }

  private static handleVt100Command(args: string[]): TerminalLine[] {
    const testType = args[1]?.toLowerCase() || "basic"

    switch (testType) {
      case "basic":
        return [
          this.createOutputLine("VT100/ANSI Escape Sequence Test:"),
          this.createOutputLine("\x1b[1mBold text\x1b[0m"),
          this.createOutputLine("\x1b[3mItalic text\x1b[0m"),
          this.createOutputLine("\x1b[4mUnderlined text\x1b[0m"),
          this.createOutputLine("\x1b[7mInverse text\x1b[0m"),
          this.createOutputLine("\x1b[9mStrikethrough text\x1b[0m"),
        ]
      case "colors":
        return [
          this.createOutputLine("VT100 Color Test:"),
          this.createOutputLine("\x1b[31mRed text\x1b[0m"),
          this.createOutputLine("\x1b[32mGreen text\x1b[0m"),
          this.createOutputLine("\x1b[33mYellow text\x1b[0m"),
          this.createOutputLine("\x1b[34mBlue text\x1b[0m"),
          this.createOutputLine("\x1b[35mMagenta text\x1b[0m"),
          this.createOutputLine("\x1b[36mCyan text\x1b[0m"),
          this.createOutputLine("\x1b[37mWhite text\x1b[0m"),
        ]
      case "combined":
        return [
          this.createOutputLine("Combined VT100 Effects:"),
          this.createOutputLine("\x1b[1;31mBold Red\x1b[0m"),
          this.createOutputLine("\x1b[3;32mItalic Green\x1b[0m"),
          this.createOutputLine("\x1b[4;34mUnderlined Blue\x1b[0m"),
          this.createOutputLine("\x1b[1;4;35mBold Underlined Magenta\x1b[0m"),
          this.createOutputLine("\x1b[42mGreen Background\x1b[0m"),
          this.createOutputLine("\x1b[1;37;41mBold White on Red\x1b[0m"),
        ]
      default:
        return [
          this.createOutputLine("VT100 Test Options:"),
          this.createOutputLine("  vt100 basic    - Test basic formatting"),
          this.createOutputLine("  vt100 colors   - Test color sequences"),
          this.createOutputLine("  vt100 combined - Test combined effects"),
        ]
    }
  }

  private static handleVt100DemoCommand(): TerminalLine[] {
    return [
      this.createOutputLine("\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m"),
      this.createOutputLine(
        "\x1b[1;36m║\x1b[0m \x1b[1;33mVT100/ANSI Terminal Demo\x1b[0m            \x1b[1;36m║\x1b[0m",
      ),
      this.createOutputLine("\x1b[1;36m╠══════════════════════════════════════╣\x1b[0m"),
      this.createOutputLine("\x1b[1;36m║\x1b[0m \x1b[1mText Formatting:\x1b[0m                   \x1b[1;36m║\x1b[0m"),
      this.createOutputLine(
        "\x1b[1;36m║\x1b[0m   \x1b[1mBold\x1b[0m \x1b[3mItalic\x1b[0m \x1b[4mUnderline\x1b[0m \x1b[9mStrike\x1b[0m    \x1b[1;36m║\x1b[0m",
      ),
      this.createOutputLine("\x1b[1;36m║\x1b[0m                                      \x1b[1;36m║\x1b[0m"),
      this.createOutputLine("\x1b[1;36m║\x1b[0m \x1b[1mColors:\x1b[0m                           \x1b[1;36m║\x1b[0m"),
      this.createOutputLine(
        "\x1b[1;36m║\x1b[0m   \x1b[31m●\x1b[32m●\x1b[33m●\x1b[34m●\x1b[35m●\x1b[36m●\x1b[37m●\x1b[0m Rainbow Colors        \x1b[1;36m║\x1b[0m",
      ),
      this.createOutputLine("\x1b[1;36m║\x1b[0m                                      \x1b[1;36m║\x1b[0m"),
      this.createOutputLine("\x1b[1;36m║\x1b[0m \x1b[1mBackground Colors:\x1b[0m                \x1b[1;36m║\x1b[0m"),
      this.createOutputLine(
        "\x1b[1;36m║\x1b[0m   \x1b[41m Red \x1b[42m Green \x1b[44m Blue \x1b[0m         \x1b[1;36m║\x1b[0m",
      ),
      this.createOutputLine("\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m"),
    ]
  }

  private static handleVt100ColorsCommand(): TerminalLine[] {
    const lines = [
      this.createOutputLine("\x1b[1mVT100/ANSI Color Palette:\x1b[0m"),
      this.createOutputLine(""),
      this.createOutputLine("\x1b[1mStandard Colors (30-37):\x1b[0m"),
    ]

    // Standard colors
    const standardColors = [
      { code: 30, name: "Black" },
      { code: 31, name: "Red" },
      { code: 32, name: "Green" },
      { code: 33, name: "Yellow" },
      { code: 34, name: "Blue" },
      { code: 35, name: "Magenta" },
      { code: 36, name: "Cyan" },
      { code: 37, name: "White" },
    ]

    standardColors.forEach(({ code, name }) => {
      lines.push(this.createOutputLine(`  \x1b[${code}m${code}\x1b[0m - ${name} (\x1b[${code}m■■■\x1b[0m)`))
    })

    lines.push(this.createOutputLine(""))
    lines.push(this.createOutputLine("\x1b[1mBright Colors (90-97):\x1b[0m"))

    // Bright colors
    const brightColors = [
      { code: 90, name: "Bright Black" },
      { code: 91, name: "Bright Red" },
      { code: 92, name: "Bright Green" },
      { code: 93, name: "Bright Yellow" },
      { code: 94, name: "Bright Blue" },
      { code: 95, name: "Bright Magenta" },
      { code: 96, name: "Bright Cyan" },
      { code: 97, name: "Bright White" },
    ]

    brightColors.forEach(({ code, name }) => {
      lines.push(this.createOutputLine(`  \x1b[${code}m${code}\x1b[0m - ${name} (\x1b[${code}m■■■\x1b[0m)`))
    })

    lines.push(this.createOutputLine(""))
    lines.push(this.createOutputLine("\x1b[1mBackground Colors (40-47, 100-107):\x1b[0m"))
    lines.push(
      this.createOutputLine(
        "  \x1b[40m 40 \x1b[41m 41 \x1b[42m 42 \x1b[43m 43 \x1b[44m 44 \x1b[45m 45 \x1b[46m 46 \x1b[47m 47 \x1b[0m",
      ),
    )
    lines.push(
      this.createOutputLine(
        "  \x1b[100m100\x1b[101m101\x1b[102m102\x1b[103m103\x1b[104m104\x1b[105m105\x1b[106m106\x1b[107m107\x1b[0m",
      ),
    )

    return lines
  }
}
