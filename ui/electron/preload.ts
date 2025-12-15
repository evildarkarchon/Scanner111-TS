import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Scanner operations
  scanCrashLog: (filePath: string, game?: string) =>
    ipcRenderer.invoke('scan-crash-log', filePath, game),

  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // File dialogs
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('save-file-dialog', defaultName),
});

// Type definitions for the exposed API
export interface ElectronAPI {
  scanCrashLog: (filePath: string, game?: string) => Promise<ScanResult>;
  getAppInfo: () => Promise<AppInfo>;
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: (defaultName: string) => Promise<string | null>;
}

export interface AppInfo {
  name: string;
  title: string;
  version: string;
}

export interface ScanResult {
  status: string;
  issues: Issue[];
  metadata?: ScanMetadata;
  rawOutput?: string;
}

export interface Issue {
  id: string;
  severity: string;
  title: string;
  description: string;
  suggestion?: string;
  lineNumber?: number;
}

export interface ScanMetadata {
  startTime: string;
  endTime?: string;
  durationMs?: number;
  filePath: string;
  game: string;
  linesProcessed: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
