import type { ScanStatus } from '../types';

interface StatusBarProps {
  status: ScanStatus;
  filePath: string | null;
  issueCount?: number;
}

export function StatusBar({ status, filePath, issueCount }: StatusBarProps) {
  const statusText = {
    idle: 'Ready',
    scanning: 'Scanning...',
    complete: `Complete${issueCount !== undefined ? ` - ${issueCount} issue${issueCount !== 1 ? 's' : ''} found` : ''}`,
    error: 'Error',
  };

  const statusColor = {
    idle: 'bg-slate-500',
    scanning: 'bg-blue-500',
    complete: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <footer className="bg-slate-800 border-t border-slate-700 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor[status]}`} />
          <span className="text-slate-400">{statusText[status]}</span>
        </div>

        {filePath && (
          <div className="text-slate-500 truncate max-w-md" title={filePath}>
            {filePath}
          </div>
        )}
      </div>
    </footer>
  );
}
