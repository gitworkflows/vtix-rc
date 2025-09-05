import { CommandExecutor } from './CommandExecutor';

type AnalysisType = 'command' | 'code' | 'explanation' | 'question' | 'error';

interface AnalysisResult {
  type: AnalysisType;
  content: string;
  confidence: number;
}

export class NLAnalyzer {
  private commandMap: Record<string, string> = {
    'list files': 'ls -la',
    'show directory': 'pwd',
    'show processes': 'ps aux',
    'show disk usage': 'df -h',
    'show memory': 'free -h',
  };

  constructor(private executor: CommandExecutor) {}

  public async analyze(input: string): Promise<AnalysisResult> {
    try {
      const lowerInput = input.toLowerCase().trim();
      
      // Check for direct command mapping
      const directCommand = this.commandMap[lowerInput];
      if (directCommand) {
        return { 
          type: 'command', 
          content: directCommand, 
          confidence: 0.9 
        };
      }

      // Simple pattern matching
      if (this.isQuestion(lowerInput)) {
        return { 
          type: 'question', 
          content: `I see you asked: ${input}`, 
          confidence: 0.8 
        };
      }

      if (this.looksLikeCommandRequest(lowerInput)) {
        const command = this.translateToCommand(lowerInput);
        if (command) {
          return { 
            type: 'command', 
            content: command, 
            confidence: 0.7 
          };
        }
      }

      // Default to explanation
      return { 
        type: 'explanation', 
        content: `I'm not sure how to process: ${input}`, 
        confidence: 0.5 
      };
    } catch (error) {
      return { 
        type: 'error', 
        content: `Error analyzing input: ${error.message}`, 
        confidence: 1.0 
      };
    }
  }

  private isQuestion(input: string): boolean {
    return input.endsWith('?') || 
           input.startsWith('what') || 
           input.startsWith('how') || 
           input.startsWith('why') ||
           input.startsWith('where') ||
           input.includes('help');
  }

  private looksLikeCommandRequest(input: string): boolean {
    const triggers = ['run', 'execute', 'show', 'list', 'get', 'find', 'check'];
    return triggers.some(trigger => input.startsWith(trigger));
  }

  private translateToCommand(input: string): string | null {
    // Simple translation logic - can be enhanced with more sophisticated NLP
    if (input.includes('list') && input.includes('file')) {
      return 'ls -la';
    }
    if (input.includes('current directory')) {
      return 'pwd';
    }
    if (input.includes('process') || input.includes('running')) {
      return 'ps aux';
    }
    if (input.includes('disk')) {
      return 'df -h';
    }
    if (input.includes('memory')) {
      return 'free -h';
    }
    return null;
  }
}
