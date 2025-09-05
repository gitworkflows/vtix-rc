import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number | null;
  command: string;
}

export class CommandExecutor {
  private cwd: string;
  private env: NodeJS.ProcessEnv;

  constructor(cwd: string = process.cwd(), env: NodeJS.ProcessEnv = { ...process.env }) {
    this.cwd = cwd;
    this.env = env;
  }

  /**
   * Execute a shell command
   * @param command Command string to execute
   * @param options Additional spawn options
   * @returns Promise with command execution result
   */
  public async execute(
    command: string,
    options: SpawnOptions = {}
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const [cmd, ...args] = this.parseCommand(command);
      const spawnOptions: SpawnOptions = {
        cwd: this.cwd,
        env: this.env,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
        ...options,
      };

      const childProcess = spawn(cmd, args, spawnOptions);
      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output: output.trim(),
          error: errorOutput.trim() || undefined,
          exitCode: code,
          command: [cmd, ...args].join(' '),
        });
      });

      childProcess.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          exitCode: null,
          command: [cmd, ...args].join(' '),
        });
      });
    });
  }

  /**
   * Change the current working directory
   */
  public setCwd(newCwd: string): void {
    this.cwd = path.resolve(this.cwd, newCwd);
  }

  /**
   * Get the current working directory
   */
  public getCwd(): string {
    return this.cwd;
  }

  /**
   * Set environment variables
   */
  public setEnv(vars: Record<string, string>): void {
    this.env = { ...this.env, ...vars };
  }

  /**
   * Parse a command string into command and arguments
   */
  private parseCommand(command: string): string[] {
    // Simple command parsing - can be enhanced for more complex cases
    const parts = command.match(/\S+/g) || [];
    return parts.length > 0 ? parts : [];
  }
}
