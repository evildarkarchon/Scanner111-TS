import type { Issue, MessageSeverity } from '../types';

interface IssueCardProps {
  issue: Issue;
}

const severityConfig: Record<
  MessageSeverity,
  { bg: string; border: string; icon: string; text: string }
> = {
  critical: {
    bg: 'bg-red-900/40',
    border: 'border-red-600',
    icon: 'text-red-400',
    text: 'text-red-300',
  },
  error: {
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    icon: 'text-red-400',
    text: 'text-red-300',
  },
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700',
    icon: 'text-yellow-400',
    text: 'text-yellow-300',
  },
  info: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-700',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
  debug: {
    bg: 'bg-slate-800',
    border: 'border-slate-600',
    icon: 'text-slate-400',
    text: 'text-slate-300',
  },
};

function SeverityIcon({ severity }: { severity: MessageSeverity }) {
  const color = severityConfig[severity].icon;

  if (severity === 'critical' || severity === 'error') {
    return (
      <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }

  if (severity === 'warning') {
    return (
      <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }

  return (
    <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function IssueCard({ issue }: IssueCardProps) {
  const config = severityConfig[issue.severity];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <SeverityIcon severity={issue.severity} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${config.text}`}>{issue.title}</h4>
            {issue.lineNumber && (
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                Line {issue.lineNumber}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-300 mb-2">{issue.description}</p>

          {issue.suggestion && (
            <div className="text-sm text-slate-400 bg-slate-800/50 rounded p-2 mt-2">
              <span className="font-medium text-slate-300">Suggestion:</span> {issue.suggestion}
            </div>
          )}

          {issue.relatedMod && (
            <div className="text-xs text-slate-500 mt-2">
              Related mod: <span className="text-slate-400">{issue.relatedMod}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
