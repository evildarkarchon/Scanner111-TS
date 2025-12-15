import type { ScanResult, Issue } from '../types';
import { IssueCard } from './IssueCard';

interface ScanResultsProps {
  result: ScanResult;
  onReset: () => void;
}

export function ScanResults({ result, onReset }: ScanResultsProps) {
  const { issues, metadata } = result;

  const errorCount = issues.filter((i) => i.severity === 'error' || i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info' || i.severity === 'debug').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-xs text-slate-400">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
            <div className="text-xs text-slate-400">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{infoCount}</div>
            <div className="text-xs text-slate-400">Info</div>
          </div>
        </div>

        {metadata && (
          <div className="text-right text-sm text-slate-400">
            <div>Game: <span className="text-slate-300">{metadata.game}</span></div>
            <div>Lines: <span className="text-slate-300">{metadata.linesProcessed.toLocaleString()}</span></div>
            {metadata.durationMs !== undefined && (
              <div>Time: <span className="text-slate-300">{metadata.durationMs}ms</span></div>
            )}
          </div>
        )}
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-green-400 mb-2">No Issues Found</h3>
          <p className="text-green-300/80">The crash log doesn't contain any known problematic patterns.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">
            Issues Found ({issues.length})
          </h3>
          {issues.map((issue, index) => (
            <IssueCard key={`${issue.id}-${index}`} issue={issue} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          Scan Another File
        </button>
      </div>
    </div>
  );
}
