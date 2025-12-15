export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';

export type SupportedGame = 'fallout4' | 'skyrim';

export type MessageSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface ScanResult {
  status: string;
  issues: Issue[];
  metadata?: ScanMetadata;
  rawOutput?: string;
}

export interface Issue {
  id: string;
  severity: MessageSeverity;
  title: string;
  description: string;
  suggestion?: string;
  relatedMod?: string;
  lineNumber?: number;
}

export interface ScanMetadata {
  startTime: string;
  endTime?: string;
  durationMs?: number;
  filePath: string;
  game: SupportedGame;
  linesProcessed: number;
}

export interface AppInfo {
  name: string;
  title: string;
  version: string;
}
