interface HeaderProps {
  onOpenFile: () => void;
  onReset: () => void;
}

export function Header({ onOpenFile, onReset }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CL</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">CLASSIC Scanner</h1>
            <p className="text-xs text-slate-400">Crash Log Auto Scanner</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFile}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Open Log
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
