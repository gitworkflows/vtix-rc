/**
 * @fileoverview Virtual file system implementation for terminal
 * @version 1.0.0
 */

/**
 * Represents a node in the file system (file or directory)
 */
export interface FileSystemNode {
  /** Name of the file or directory */
  name: string
  /** Type of the node */
  type: "file" | "directory"
  /** Content of the file (only for files) */
  content?: string
  /** Child nodes (only for directories) */
  children?: { [key: string]: FileSystemNode }
  /** Unix-style permissions string */
  permissions: string
  /** Size in bytes */
  size: number
  /** Last modified date */
  modified: Date
}

/**
 * File system operation result
 */
export interface FileSystemResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean
  /** Result data if successful */
  data?: T
  /** Error message if failed */
  error?: string
}

/**
 * Virtual file system implementation
 * Provides a simulated Unix-like file system for the terminal
 */
export class FileSystem {
  private root: FileSystemNode
  private currentPath: string[]

  /**
   * Initialize the file system with default structure
   */
  constructor() {
    this.currentPath = []
    this.root = this.createDefaultFileSystem()
  }

  /**
   * Get the current directory node
   * @returns The current directory node
   */
  getCurrentDirectory(): FileSystemNode {
    let current = this.root
    for (const segment of this.currentPath) {
      if (current.children && current.children[segment]) {
        current = current.children[segment]
      }
    }
    return current
  }

  /**
   * Get the current path as a string
   * @returns Current path string (e.g., "/home/user")
   */
  getCurrentPath(): string {
    return this.currentPath.length === 0 ? "/" : "/" + this.currentPath.join("/")
  }

  /**
   * List contents of a directory
   * @param path Optional path to list (defaults to current directory)
   * @returns Array of file system nodes
   */
  listDirectory(path?: string): FileSystemNode[] {
    const targetDir = path ? this.resolvePath(path) : this.getCurrentDirectory()
    if (!targetDir || targetDir.type !== "directory" || !targetDir.children) {
      return []
    }
    return Object.values(targetDir.children)
  }

  /**
   * Change current directory
   * @param path Path to change to
   * @returns True if successful, false otherwise
   */
  changeDirectory(path: string): boolean {
    if (path === "/") {
      this.currentPath = []
      return true
    }

    if (path === "..") {
      if (this.currentPath.length > 0) {
        this.currentPath.pop()
      }
      return true
    }

    if (path === ".") {
      return true
    }

    const targetDir = this.resolvePath(path)
    if (targetDir && targetDir.type === "directory") {
      if (path.startsWith("/")) {
        this.currentPath = path.split("/").filter(Boolean)
      } else {
        this.currentPath.push(...path.split("/").filter(Boolean))
      }
      return true
    }
    return false
  }

  /**
   * Read contents of a file
   * @param path Path to the file
   * @returns File contents or null if not found
   */
  readFile(path: string): string | null {
    const file = this.resolvePath(path)
    if (file && file.type === "file") {
      return file.content || ""
    }
    return null
  }

  /**
   * Create a new directory
   * @param name Name of the directory
   * @returns True if created successfully, false if already exists
   */
  createDirectory(name: string): boolean {
    const currentDir = this.getCurrentDirectory()
    if (currentDir.children && !currentDir.children[name]) {
      currentDir.children[name] = {
        name,
        type: "directory",
        permissions: "drwxr-xr-x",
        size: 4096,
        modified: new Date(),
        children: {},
      }
      return true
    }
    return false
  }

  /**
   * Create a new file
   * @param name Name of the file
   * @param content Initial content (default: empty)
   * @returns True if created successfully, false if already exists
   */
  createFile(name: string, content = ""): boolean {
    const currentDir = this.getCurrentDirectory()
    if (currentDir.children && !currentDir.children[name]) {
      currentDir.children[name] = {
        name,
        type: "file",
        content,
        permissions: "-rw-r--r--",
        size: content.length,
        modified: new Date(),
      }
      return true
    }
    return false
  }

  /**
   * Resolve a path to a file system node
   * @param path Path to resolve
   * @returns File system node or null if not found
   * @private
   */
  private resolvePath(path: string): FileSystemNode | null {
    let current = path.startsWith("/") ? this.root : this.getCurrentDirectory()
    const segments = path.split("/").filter(Boolean)

    for (const segment of segments) {
      if (segment === "..") {
        // Go up one level - this is simplified
        continue
      }
      if (segment === ".") {
        continue
      }
      if (current.children && current.children[segment]) {
        current = current.children[segment]
      } else {
        return null
      }
    }
    return current
  }

  /**
   * Create the default file system structure
   * @returns Root file system node
   * @private
   */
  private createDefaultFileSystem(): FileSystemNode {
    return {
      name: "/",
      type: "directory",
      permissions: "drwxr-xr-x",
      size: 4096,
      modified: new Date(),
      children: {
        home: {
          name: "home",
          type: "directory",
          permissions: "drwxr-xr-x",
          size: 4096,
          modified: new Date(),
          children: {
            user: {
              name: "user",
              type: "directory",
              permissions: "drwxr-xr-x",
              size: 4096,
              modified: new Date(),
              children: {
                "welcome.txt": {
                  name: "welcome.txt",
                  type: "file",
                  content: "Welcome to Hyper Terminal!\nThis is a simulated file system.",
                  permissions: "-rw-r--r--",
                  size: 58,
                  modified: new Date(),
                },
                ".bashrc": {
                  name: ".bashrc",
                  type: "file",
                  content: `# ~/.bashrc - Bash configuration file

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

echo "Bash configuration loaded"`,
                  permissions: "-rw-r--r--",
                  size: 500,
                  modified: new Date(),
                },
                ".zshrc": {
                  name: ".zshrc",
                  type: "file",
                  content: `# ~/.zshrc - Zsh configuration file

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

echo "Zsh configuration loaded"`,
                  permissions: "-rw-r--r--",
                  size: 600,
                  modified: new Date(),
                },
                ".config": {
                  name: ".config",
                  type: "directory",
                  permissions: "drwxr-xr-x",
                  size: 4096,
                  modified: new Date(),
                  children: {
                    fish: {
                      name: "fish",
                      type: "directory",
                      permissions: "drwxr-xr-x",
                      size: 4096,
                      modified: new Date(),
                      children: {
                        "config.fish": {
                          name: "config.fish",
                          type: "file",
                          content: `# ~/.config/fish/config.fish - Fish configuration file

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
end`,
                          permissions: "-rw-r--r--",
                          size: 450,
                          modified: new Date(),
                        },
                      },
                    },
                  },
                },
                "Microsoft.PowerShell_profile.ps1": {
                  name: "Microsoft.PowerShell_profile.ps1",
                  type: "file",
                  content: `# Microsoft.PowerShell_profile.ps1 - PowerShell configuration file

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

Write-Host "PowerShell configuration loaded" -ForegroundColor Green`,
                  permissions: "-rw-r--r--",
                  size: 550,
                  modified: new Date(),
                },
                workflows: {
                  name: "workflows",
                  type: "directory",
                  permissions: "drwxr-xr-x",
                  size: 4096,
                  modified: new Date(),
                  children: {
                    "git-status.yml": {
                      name: "git-status.yml",
                      type: "file",
                      content: `name: Git Status Check
command: git status --porcelain
description: Check git repository status with clean output
tags: ["git", "version-control", "status"]
shells: ["bash", "zsh", "fish"]
author: Git Community
source_url: https://git-scm.com/docs/git-status`,
                      permissions: "-rw-r--r--",
                      size: 250,
                      modified: new Date(),
                    },
                    "docker-cleanup.yml": {
                      name: "docker-cleanup.yml",
                      type: "file",
                      content: `name: Docker System Cleanup
command: docker system prune {{flags}}
description: Clean up unused Docker resources
tags: ["docker", "cleanup", "system"]
shells: ["bash", "zsh", "fish"]
arguments:
  - name: flags
    description: Docker prune flags
    default_value: "-f"
author: Docker Community
source_url: https://docs.docker.com/engine/reference/commandline/system_prune/`,
                      permissions: "-rw-r--r--",
                      size: 400,
                      modified: new Date(),
                    },
                    "npm-audit.yml": {
                      name: "npm-audit.yml",
                      type: "file",
                      content: `name: NPM Security Audit
command: npm audit {{fix_flag}}
description: Run security audit on npm packages
tags: ["npm", "security", "audit", "nodejs"]
shells: ["bash", "zsh", "fish"]
arguments:
  - name: fix_flag
    description: Auto-fix vulnerabilities
    default_value: "--audit-level moderate"
author: NPM Team
source_url: https://docs.npmjs.com/cli/v8/commands/npm-audit`,
                      permissions: "-rw-r--r--",
                      size: 350,
                      modified: new Date(),
                    },
                  },
                },
                themes: {
                  name: "themes",
                  type: "directory",
                  permissions: "drwxr-xr-x",
                  size: 4096,
                  modified: new Date(),
                  children: {
                    "base16-asam.yml": {
                      name: "base16-asam.yml",
                      type: "file",
                      content: `accent: "#fff024"
background: "#080808"
details: darker
foreground: "#5bee00"
terminal_colors:
  bright:
    black: "#008751"
    blue: "#ab5236"
    cyan: "#ffccaa"
    green: "#1d2b53"
    magenta: "#c2c3c7"
    red: "#ffa300"
    white: "#fff1e8"
    yellow: "#7e2553"
  normal:
    black: "#000000"
    blue: "#83769c"
    cyan: "#29adff"
    green: "#00e756"
    magenta: "#ff77a8"
    red: "#ff004d"
    white: "#5f574f"
    yellow: "#fff024"`,
                      permissions: "-rw-r--r--",
                      size: 450,
                      modified: new Date(),
                    },
                    "base16-monokai.yml": {
                      name: "base16-monokai.yml",
                      type: "file",
                      content: `accent: "#f92672"
background: "#272822"
details: darker
foreground: "#f8f8f2"
terminal_colors:
  bright:
    black: "#75715e"
    blue: "#66d9ef"
    cyan: "#a1efe4"
    green: "#a6e22e"
    magenta: "#ae81ff"
    red: "#f92672"
    white: "#f9f8f5"
    yellow: "#f4bf75"
  normal:
    black: "#272822"
    blue: "#66d9ef"
    cyan: "#a1efe4"
    green: "#a6e22e"
    magenta: "#ae81ff"
    red: "#ff004d"
    white: "#f8f8f2"
    yellow: "#f4bf75"`,
                      permissions: "-rw-r--r--",
                      size: 450,
                      modified: new Date(),
                    },
                    "base16-dracula.yml": {
                      name: "base16-dracula.yml",
                      type: "file",
                      content: `accent: "#ff79c6"
background: "#282a36"
details: darker
foreground: "#f8f8f2"
terminal_colors:
  bright:
    black: "#6272a4"
    blue: "#8be9fd"
    cyan: "#8be9fd"
    green: "#50fa7b"
    magenta: "#ff79c6"
    red: "#ff5555"
    white: "#ffffff"
    yellow: "#f1fa8c"
  normal:
    black: "#21222c"
    blue: "#bd93f9"
    cyan: "#8be9fd"
    green: "#50fa7b"
    magenta: "#ff79c6"
    red: "#ff5555"
    white: "#f8f8f2"
    yellow: "#f1fa8c"`,
                      permissions: "-rw-r--r--",
                      size: 450,
                      modified: new Date(),
                    },
                  },
                },
                documents: {
                  name: "documents",
                  type: "directory",
                  permissions: "drwxr-xr-x",
                  size: 4096,
                  modified: new Date(),
                  children: {},
                },
              },
            },
          },
        },
        usr: {
          name: "usr",
          type: "directory",
          permissions: "drwxr-xr-x",
          size: 4096,
          modified: new Date(),
          children: {
            bin: {
              name: "bin",
              type: "directory",
              permissions: "drwxr-xr-x",
              size: 4096,
              modified: new Date(),
              children: {},
            },
          },
        },
      },
    }
  }
}
