import { CommandDetector } from './CommandDetector';
import { CommandExecutor } from './CommandExecutor';
import { NLAnalyzer } from './NLAnalyzer';

export class TerminalAgent {
  private detector: CommandDetector;
  private executor: CommandExecutor;
  private analyzer: NLAnalyzer;

  constructor() {
    this.detector = new CommandDetector();
    this.executor = new CommandExecutor();
    this.analyzer = new NLAnalyzer(this.executor);
  }

  public async process(input: string): Promise<string> {
    const { isCommand, confidence } = CommandDetector.detect(input);
    
    if (isCommand && confidence > 0.5) {
      const cmd = CommandDetector.normalizeCommand(input);
      const result = await this.executor.execute(cmd);
      return result.success ? result.output : `Error: ${result.error || 'Command failed'}`;
    } else {
      const analysis = await this.analyzer.analyze(input);
      return this.handleAnalysis(analysis);
    }
  }

  private async handleAnalysis(analysis: any): Promise<string> {
    switch (analysis.type) {
      case 'command':
        const result = await this.executor.execute(analysis.content);
        return result.success ? result.output : `Error: ${result.error}`;
      case 'question':
        return `I see you have a question: ${analysis.content}`;
      case 'code':
        return `Here's some code: ${analysis.content}`;
      default:
        return `I'm not sure how to handle that: ${analysis.content}`;
    }
  }
}
