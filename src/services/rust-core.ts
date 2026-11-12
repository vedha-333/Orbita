import initWasm, { WorkspaceManager } from '../wasm/task_browser_core';
import type { Workspace } from '../types/workspace';

let managerInstance: WorkspaceManager | null = null;
let isInitialized = false;

/**
 * Initializes the Rust WebAssembly module
 */
export async function initRustCore(): Promise<WorkspaceManager> {
  if (managerInstance && isInitialized) {
    return managerInstance;
  }

  try {
    await initWasm();
    managerInstance = new WorkspaceManager();
    isInitialized = true;
    console.info('🚀 [Rust Wasm] Core engine initialized successfully');
    return managerInstance;
  } catch (err) {
    console.error('❌ [Rust Wasm] Failed to initialize core:', err);
    throw err;
  }
}

/**
 * Syncs the current list of Workspaces into the Rust memory state
 */
export function syncWorkspacesToRust(workspaces: Workspace[]): void {
  if (!managerInstance || !isInitialized) return;
  try {
    const json = JSON.stringify(workspaces);
    managerInstance.loadFromJson(json);
  } catch (err) {
    console.warn('[Rust Wasm] syncWorkspacesToRust error:', err);
  }
}

export interface RustSearchResult {
  workspaceId: string;
  workspaceName: string;
  pageId?: string;
  pageTitle?: string;
  pageUrl?: string;
  score: number;
}

/**
 * Executes a high-performance in-memory search using Rust
 */
export function searchViaRust(query: string): RustSearchResult[] {
  if (!managerInstance || !isInitialized) return [];
  try {
    return managerInstance.search(query) as RustSearchResult[];
  } catch (err) {
    console.warn('[Rust Wasm] search error:', err);
    return [];
  }
}

/**
 * Gets workspace counts calculated directly from Rust
 */
export function getRustStats(): { workspaceCount: number; totalPagesCount: number } {
  if (!managerInstance || !isInitialized) {
    return { workspaceCount: 0, totalPagesCount: 0 };
  }
  return {
    workspaceCount: managerInstance.getWorkspaceCount(),
    totalPagesCount: managerInstance.getTotalPagesCount(),
  };
}

