import * as rpc from 'vscode-jsonrpc/node';
import { MessageConnection, createMessageConnection } from 'vscode-jsonrpc/node';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { URI } from 'vscode-uri';

interface ServerOptions {
  command: string;
  args?: string[];
  options?: any;
}

export class LSPClient {
  private connection: MessageConnection | null = null;
  private serverProcess: ChildProcess | null = null;
  private serverOptions: ServerOptions;
  private workspaceRoot: string;
  public readonly language: string;

  private constructor(serverOptions: ServerOptions, workspaceRoot: string, language: string) {
    this.serverOptions = serverOptions;
    this.workspaceRoot = workspaceRoot;
    this.language = language;
  }

  public static async create(language: string, workspaceRoot: string): Promise<LSPClient | null> {
    const serverConfigs: Record<string, ServerOptions> = {
      typescript: {
        command: 'typescript-language-server',
        args: ['--stdio'],
        options: {},
      },
      javascript: {
        command: 'typescript-language-server',
        args: ['--stdio'],
        options: {},
      },
      python: {
        command: 'pyls',
        args: [],
        options: {},
      },
    };

    const config = serverConfigs[language.toLowerCase()];
    if (!config) {
      console.warn(`No LSP server configured for language: ${language}`);
      return null;
    }

    const client = new LSPClient(config, workspaceRoot, language);
    try {
      await client.start();
      return client;
    } catch (error) {
      console.error(`Failed to start LSP client for ${language}:`, error);
      return null;
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { command, args = [], options = {} } = this.serverOptions;
        
        // Spawn the language server process
        this.serverProcess = spawn(command, args, {
          ...options,
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.workspaceRoot
        });

        // Handle process errors
        this.serverProcess.on('error', (error) => {
          console.error('Language server failed to start:', error);
          this.stop();
          reject(error);
        });

        // Handle process exit
        this.serverProcess.on('exit', (code) => {
          console.log(`Language server exited with code ${code}`);
          this.connection = null;
          this.serverProcess = null;
        });

        // Create message connection using stdio
        this.connection = createMessageConnection(
          this.serverProcess.stdout!,
          this.serverProcess.stdin!
        );

        // Log any errors from the server
        this.serverProcess.stderr?.on('data', (data) => {
          console.error('Language server error:', data.toString());
        });

        // Start listening to the connection
        this.connection.listen();

        // Initialize the server
        this.initialize().then(resolve).catch(reject);
      } catch (error) {
        console.error('Failed to start language server:', error);
        this.stop();
        reject(error);
      }
    });
  }

  private async initialize(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not established');
    }

    // Send initialization request
    const result = await this.connection.sendRequest('initialize', {
      processId: process.pid,
      rootUri: URI.file(this.workspaceRoot).toString(),
      capabilities: {
        // Add client capabilities here
        textDocument: {
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
            },
          },
          hover: {
            dynamicRegistration: true,
            contentFormat: ['markdown', 'plaintext'],
          },
          // Add more capabilities as needed
        },
      },
      workspaceFolders: [
        {
          uri: URI.file(this.workspaceRoot).toString(),
          name: path.basename(this.workspaceRoot),
        },
      ],
    });

    console.log('Language server initialized:', result);
    
    // Send initialized notification
    this.connection.sendNotification('initialized', {});
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.sendNotification('exit');
      } catch (error) {
        console.error('Error sending exit notification:', error);
      }
      this.connection.dispose();
      this.connection = null;
    }

    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  public getConnection(): MessageConnection | null {
    return this.connection;
  }

  // Add more LSP method wrappers as needed
  public async getCompletions(textDocument: any, position: any): Promise<any> {
    if (!this.connection) {
      throw new Error('Connection not established');
    }
    return this.connection.sendRequest('textDocument/completion', {
      textDocument,
      position,
    });
  }

  public async getHover(textDocument: any, position: any): Promise<any> {
    if (!this.connection) {
      throw new Error('Connection not established');
    }
    return this.connection.sendRequest('textDocument/hover', {
      textDocument,
      position,
    });
  }
}

// The factory function is now a static method on the LSPClient class
