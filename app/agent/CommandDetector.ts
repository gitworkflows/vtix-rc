export class CommandDetector {
  private static readonly COMMAND_REGEX = /^\s*([a-zA-Z0-9_-]+)(\s+[^\s]+)*\s*$/;
  private static readonly COMMAND_PREFIX = '>';
  private static readonly NL_INDICATORS = [
    'how to', 'what is', 'why', 'when', 'where',
    'help me', 'can you', 'could you', 'please',
    '?', 'help', 'explain', 'show', 'tell'
  ];

  /**
   * Detects if the input is a command or natural language
   * @param input User input string
   * @returns Object with detection result and confidence score (0-1)
   */
  public static detect(input: string): { isCommand: boolean; confidence: number } {
    if (!input || !input.trim()) {
      return { isCommand: false, confidence: 0 };
    }

    // Check for explicit command prefix
    if (input.startsWith(CommandDetector.COMMAND_PREFIX)) {
      return { isCommand: true, confidence: 1 };
    }

    // Check if it looks like a command
    const commandMatch = CommandDetector.COMMAND_REGEX.test(input);
    if (commandMatch) {
      const firstToken = input.trim().split(/\s+/)[0].toLowerCase();
      
      // Common shell commands
      const commonCommands = [
        'ls', 'cd', 'git', 'npm', 'yarn', 'docker', 'kubectl',
        'echo', 'cat', 'grep', 'find', 'ps', 'kill', 'mkdir',
        'rm', 'cp', 'mv', 'chmod', 'chown', 'ssh', 'scp', 'curl', 'wget'
      ];

      if (commonCommands.includes(firstToken)) {
        return { isCommand: true, confidence: 0.9 };
      }
      
      // Check for command with path/arguments
      if (input.includes('/') || input.includes(' ') || input.includes('|') || input.includes('&&')) {
        return { isCommand: true, confidence: 0.8 };
      }
    }

    // Check for natural language indicators
    const lowerInput = input.toLowerCase();
    const hasNLIndicator = CommandDetector.NL_INDICATORS.some(
      indicator => lowerInput.includes(indicator)
    );

    if (hasNLIndicator) {
      return { isCommand: false, confidence: 0.9 };
    }

    // Default to command if it looks like one, otherwise NL
    return {
      isCommand: commandMatch,
      confidence: commandMatch ? 0.7 : 0.3
    };
  }

  /**
   * Normalizes command input by removing the command prefix if present
   */
  public static normalizeCommand(input: string): string {
    return input.startsWith(CommandDetector.COMMAND_PREFIX)
      ? input.slice(CommandDetector.COMMAND_PREFIX.length).trim()
      : input.trim();
  }
}
