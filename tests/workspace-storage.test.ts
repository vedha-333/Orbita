import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addPagesToWorkspace,
  removePageFromWorkspace,
  reorderPages,
  exportDataToJson,
  importDataFromJson,
} from '../src/storage/workspace-storage';

// Node environment mock for window.localStorage
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('Workspace Storage Operations', () => {
  beforeEach(() => {
    (global as any).window = {
      localStorage: new LocalStorageMock(),
    };
  });

  it('initializes with starter presets if storage is empty', async () => {
    const ws = await getWorkspaces();
    expect(ws.length).toBeGreaterThanOrEqual(4);
    expect(ws.some((w) => w.name === 'DSA Practice')).toBe(true);
  });

  it('creates a new workspace and retrieves it', async () => {
    const created = await createWorkspace({
      name: 'System Design',
      description: 'Distributed systems notes',
      icon: '🏗️',
      color: '#3B82F6',
      category: 'Research',
      isPinned: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('System Design');

    const all = await getWorkspaces();
    const match = all.find((w) => w.id === created.id);
    expect(match).toBeDefined();
    expect(match?.name).toBe('System Design');
    expect(match?.isPinned).toBe(true);
  });

  it('updates an existing workspace', async () => {
    const ws = await createWorkspace({
      name: 'Old Title',
      icon: '📁',
      color: '#3B82F6',
    });

    const updated = await updateWorkspace(ws.id, {
      name: 'New Title',
      description: 'Updated notes',
    });

    expect(updated.name).toBe('New Title');
    expect(updated.description).toBe('Updated notes');
  });

  it('adds and removes pages in a workspace', async () => {
    const ws = await createWorkspace({
      name: 'Test WS',
      icon: '⚡',
      color: '#EC4899',
    });

    const withPages = await addPagesToWorkspace(ws.id, [
      {
        title: 'Example Page 1',
        url: 'https://example.com/1',
      },
      {
        title: 'Example Page 2',
        url: 'https://example.com/2',
      },
    ]);

    expect(withPages.pages.length).toBe(2);
    expect(withPages.pages[0].title).toBe('Example Page 1');

    const pageToRemoveId = withPages.pages[0].id;
    const afterRemoval = await removePageFromWorkspace(ws.id, pageToRemoveId);
    expect(afterRemoval.pages.length).toBe(1);
    expect(afterRemoval.pages[0].url).toBe('https://example.com/2');
  });

  it('reorders pages properly', async () => {
    const ws = await createWorkspace({
      name: 'Reorder Test',
      icon: '📑',
      color: '#10B981',
      pages: [
        { id: 'p1', title: 'A', url: 'https://a.com', position: 0, savedAt: 100 },
        { id: 'p2', title: 'B', url: 'https://b.com', position: 1, savedAt: 100 },
      ],
    });

    const reordered = await reorderPages(ws.id, ['p2', 'p1']);
    expect(reordered.pages[0].id).toBe('p2');
    expect(reordered.pages[1].id).toBe('p1');
  });

  it('deletes a workspace', async () => {
    const ws = await createWorkspace({
      name: 'To Delete',
      icon: '🗑️',
      color: '#EF4444',
    });

    await deleteWorkspace(ws.id);
    const all = await getWorkspaces();
    expect(all.some((w) => w.id === ws.id)).toBe(false);
  });

  it('exports and imports JSON data', async () => {
    const jsonStr = await exportDataToJson();
    expect(jsonStr).toContain('workspaces');

    const result = await importDataFromJson(jsonStr);
    expect(result.count).toBeGreaterThan(0);
  });
});
