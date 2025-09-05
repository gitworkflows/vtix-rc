export type ShellType = "bash" | "zsh" | "fish" | "powershell"

export interface ShellConfig {
  name: string
  prompt: string
  configFile: string
  aliases: { [key: string]: string }
  functions: { [key: string]: string }
  variables: { [key: string]: string }
}

export class ShellSystem {
  private currentShell: ShellType = "bash"
  private shells: { [key in ShellType]: ShellConfig } = {
    bash: {
      name: "Bash",
      prompt: "$",
      configFile: "~/.bashrc",
      aliases: {},
      functions: {},
      variables: {
        PS1: "\\u@\\h:\\w\\$ ",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        HOME: "/home/user",
        SHELL: "/bin/bash",
      },
    },
    zsh: {
      name: "Zsh",
      prompt: "%",
      configFile: "~/.zshrc",
      aliases: {},
      functions: {},
      variables: {
        PS1: "%n@%m:%~%# ",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        HOME: "/home/user",
        SHELL: "/bin/zsh",
      },
    },
    fish: {
      name: "Fish",
      prompt: ">",
      configFile: "~/.config/fish/config.fish",
      aliases: {},
      functions: {},
      variables: {
        PATH: "/usr/local/bin /usr/bin /bin",
        HOME: "/home/user",
        SHELL: "/usr/bin/fish",
      },
    },
    powershell: {
      name: "PowerShell",
      prompt: "PS>",
      configFile: "$PROFILE",
      aliases: {},
      functions: {},
      variables: {
        PSModulePath: "C:\\Program Files\\PowerShell\\Modules",
        HOME: "C:\\Users\\user",
        SHELL: "pwsh",
      },
    },
  }

  getCurrentShell(): ShellType {
    return this.currentShell
  }

  setShell(shell: ShellType): void {
    this.currentShell = shell
  }

  getShellConfig(): ShellConfig {
    return this.shells[this.currentShell]
  }

  getPrompt(currentPath: string): string {
    const config = this.getShellConfig()
    const username = "user"
    const hostname = "hyper-terminal"

    switch (this.currentShell) {
      case "bash":
        return `${username}@${hostname}:${currentPath}${config.prompt}`
      case "zsh":
        return `${username}@${hostname}:${currentPath}${config.prompt}`
      case "fish":
        return `${username}@${hostname} ${currentPath}${config.prompt}`
      case "powershell":
        return `${config.prompt} ${currentPath}>`
      default:
        return `${currentPath} ${config.prompt}`
    }
  }

  loadConfigFile(fileContent: string): void {
    const config = this.shells[this.currentShell]
    const lines = fileContent.split("\n")

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("#") || trimmed === "") continue

      // Parse aliases
      if (trimmed.startsWith("alias ")) {
        const aliasMatch = trimmed.match(/alias\s+([^=]+)=(.+)/)
        if (aliasMatch) {
          const [, name, value] = aliasMatch
          config.aliases[name.trim()] = value.trim().replace(/['"]/g, "")
        }
      }

      // Parse environment variables
      if (trimmed.includes("=") && !trimmed.startsWith("alias")) {
        const [name, ...valueParts] = trimmed.split("=")
        if (name && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/['"]/g, "")
          if (name.startsWith("export ")) {
            config.variables[name.replace("export ", "").trim()] = value
          } else {
            config.variables[name.trim()] = value
          }
        }
      }

      // Parse functions (simplified)
      if (trimmed.includes("function ") || trimmed.includes("()")) {
        const funcMatch = trimmed.match(/(?:function\s+)?([^(]+)$$$$/)
        if (funcMatch) {
          config.functions[funcMatch[1].trim()] = trimmed
        }
      }
    }
  }

  expandAlias(command: string): string {
    const config = this.getShellConfig()
    const parts = command.split(" ")
    const baseCommand = parts[0]

    if (config.aliases[baseCommand]) {
      parts[0] = config.aliases[baseCommand]
      return parts.join(" ")
    }

    return command
  }

  getVariable(name: string): string | undefined {
    return this.shells[this.currentShell].variables[name]
  }

  setVariable(name: string, value: string): void {
    this.shells[this.currentShell].variables[name] = value
  }

  getDefaultConfigContent(): string {
    switch (this.currentShell) {
      case "bash":
        return `# ~/.bashrc - Bash configuration file

# Aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'

# Environment variables
export PATH="/usr/local/bin:/usr/bin:/bin"
export EDITOR="nano"
export HISTSIZE=1000
export HISTFILESIZE=2000

# Custom prompt
export PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '

# Functions
function mkcd() {
    mkdir -p "$1" && cd "$1"
}

echo "Bash configuration loaded"`

      case "zsh":
        return `# ~/.zshrc - Zsh configuration file

# Aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'

# Environment variables
export PATH="/usr/local/bin:/usr/bin:/bin"
export EDITOR="nano"
export HISTSIZE=1000
export SAVEHIST=1000
export HISTFILE=~/.zsh_history

# Zsh options
setopt AUTO_CD
setopt HIST_VERIFY
setopt SHARE_HISTORY

# Custom prompt
export PS1='%F{green}%n@%m%f:%F{blue}%~%f%# '

# Functions
function mkcd() {
    mkdir -p "$1" && cd "$1"
}

echo "Zsh configuration loaded"`

      case "fish":
        return `# ~/.config/fish/config.fish - Fish configuration file

# Aliases
alias ll 'ls -la'
alias la 'ls -A'
alias l 'ls -CF'
alias grep 'grep --color=auto'
alias .. 'cd ..'
alias ... 'cd ../..'

# Environment variables
set -gx PATH /usr/local/bin /usr/bin /bin
set -gx EDITOR nano

# Functions
function mkcd
    mkdir -p $argv[1]; and cd $argv[1]
end

# Fish greeting
function fish_greeting
    echo "Fish shell configuration loaded"
end`

      case "powershell":
        return `# Microsoft.PowerShell_profile.ps1 - PowerShell configuration file

# Aliases
Set-Alias ll Get-ChildItem
Set-Alias la Get-ChildItem
Set-Alias grep Select-String

# Environment variables
$env:EDITOR = "notepad"

# Functions
function mkcd($path) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    Set-Location $path
}

function .. { Set-Location .. }
function ... { Set-Location ../.. }

# Custom prompt
function prompt {
    "PS " + (Get-Location) + "> "
}

Write-Host "PowerShell configuration loaded" -ForegroundColor Green`

      default:
        return ""
    }
  }
}
