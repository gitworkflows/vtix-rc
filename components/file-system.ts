export interface FileSystemNode {
  name: string
  type: "file" | "directory"
  content?: string
  children?: { [key: string]: FileSystemNode }
  permissions: string
  size: number
  modified: Date
}

export class FileSystem {
  private root: FileSystemNode
  private currentPath: string[]

  constructor() {
    this.currentPath = []
    this.root = {
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

  getCurrentDirectory(): FileSystemNode {
    let current = this.root
    for (const segment of this.currentPath) {
      if (current.children && current.children[segment]) {
        current = current.children[segment]
      }
    }
    return current
  }

  getCurrentPath(): string {
    return this.currentPath.length === 0 ? "/" : "/" + this.currentPath.join("/")
  }

  listDirectory(path?: string): FileSystemNode[] {
    const targetDir = path ? this.resolvePath(path) : this.getCurrentDirectory()
    if (!targetDir || targetDir.type !== "directory" || !targetDir.children) {
      return []
    }
    return Object.values(targetDir.children)
  }

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

  readFile(path: string): string | null {
    const file = this.resolvePath(path)
    if (file && file.type === "file") {
      return file.content || ""
    }
    return null
  }

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
}
