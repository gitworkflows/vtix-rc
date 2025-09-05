import { LSPClient } from "./client/LSPClient";

// Simple in-memory UI state management
class TerminalUI {
  private static instances: Set<string> = new Set();

  static addLanguage(language: string): void {
    this.instances.add(language);
    console.log(`[LSP] Added language: ${language}`);
  }

  static removeLanguage(language: string): void {
    this.instances.delete(language);
    console.log(`[LSP] Removed language: ${language}`);
  }

  static clear(): void {
    this.instances.clear();
    console.log('[LSP] Cleared all languages');
  }
}

export class LSPManager {
  private readonly clients: Map<string, LSPClient> = new Map();

  public async createClient(
    language: string,
    workspaceRoot: string
  ): Promise<LSPClient | null> {
    try {
      if (this.clients.has(language)) {
        return this.clients.get(language)!;
      }

      const client = await LSPClient.create(language, workspaceRoot);
      if (client) {
        this.clients.set(language, client);
        TerminalUI.addLanguage(language);
      }
      return client;
    } catch (error) {
      console.error(`[LSP] Failed to create client for ${language}:`, error);
      return null;
    }
  }

  public async getClient(language: string): Promise<LSPClient | undefined> {
    return this.clients.get(language);
  }

  public async shutdownClient(language: string): Promise<boolean> {
    try {
      const client = this.clients.get(language);
      if (client) {
        await client.stop();
        this.clients.delete(language);
        TerminalUI.removeLanguage(language);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[LSP] Error shutting down client for ${language}:`, error);
      return false;
    }
  }

  public async shutdownAllClients(): Promise<boolean> {
    try {
      const results = await Promise.allSettled(
        Array.from(this.clients.values()).map(async (client) => {
          try {
            await client.stop();
            TerminalUI.removeLanguage(client.language);
            return true;
          } catch (error) {
            console.error(`[LSP] Error stopping client for ${client.language}:`, error);
            return false;
          }
        })
      );
      
      const allSucceeded = results.every(result => 
        result.status === 'fulfilled' && result.value === true
      );
      
      this.clients.clear();
      TerminalUI.clear();
      
      return allSucceeded;
    } catch (error) {
      console.error('[LSP] Error during shutdown of all clients:', error);
      return false;
    }
  }
}

export const lspManager = new LSPManager();
