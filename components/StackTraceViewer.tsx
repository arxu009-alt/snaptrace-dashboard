interface ParsedFrame {
  functionName: string;
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
  raw: string;
}

interface StackTraceViewerProps {
  frames: ParsedFrame[];
  rawStack?: string;
}

export default function StackTraceViewer({ frames, rawStack }: StackTraceViewerProps) {
  if (!frames || frames.length === 0) {
    return (
      <pre className="p-4 bg-gray-900 text-gray-300 rounded-lg text-xs overflow-x-auto font-mono">
        {rawStack || 'No stack trace available.'}
      </pre>
    );
  }

  return (
    <div className="bg-gray-950 text-gray-200 rounded-lg border border-gray-800 overflow-hidden font-mono text-xs">
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 font-semibold text-gray-400">
        Parsed Stack Trace ({frames.length} frames)
      </div>
      <div className="divide-y divide-gray-800">
        {frames.map((frame, idx) => (
          <div
            key={idx}
            className={`p-3 hover:bg-gray-900/60 transition-colors ${
              idx === 0 ? 'bg-red-950/20 border-l-2 border-red-500' : ''
            }`}
          >
            <div className="flex items-center justify-between font-medium">
              <span className="text-red-400">{frame.functionName}</span>
              {frame.lineNumber && (
                <span className="text-gray-500">
                  Line {frame.lineNumber}:{frame.columnNumber}
                </span>
              )}
            </div>
            <div className="text-gray-400 text-[11px] truncate mt-1">
              {frame.fileName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}