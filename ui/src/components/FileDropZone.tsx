import { useCallback, useState } from 'react';

interface FileDropZoneProps {
  onFileSelect: (filePath: string) => void;
  onOpenDialog: () => void;
}

export function FileDropZone({ onFileSelect, onOpenDialog }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const logFile = files.find((f) => f.name.endsWith('.log') || f.name.endsWith('.txt'));

      if (logFile) {
        // In Electron, we can get the path from the file object
        const filePath = (logFile as File & { path?: string }).path;
        if (filePath) {
          onFileSelect(filePath);
        }
      }
    },
    [onFileSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenDialog();
      }
    },
    [onOpenDialog]
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: div is appropriate for drag-and-drop zone with visual feedback
    <div
      role="button"
      tabIndex={0}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
        ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onOpenDialog}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700'}`}
        >
          <svg
            className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            {isDragging ? 'Drop to scan' : 'Drop a crash log here'}
          </h2>
          <p className="text-slate-400 mb-4">or click to browse for a file</p>
          <p className="text-sm text-slate-500">
            Supports .log and .txt files from Buffout4, NetScriptFramework, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
