export interface ParsedFrame {
  functionName: string;
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
  raw: string;
}

export function parseStackTrace(stackString: string): ParsedFrame[] {
  if (!stackString) return [];

  const lines = stackString.split('\n');
  const frames: ParsedFrame[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: "at functionName (filepath:line:col)"
    const matchWithFunc = trimmed.match(/^(?:at\s+)?(.*?)\s+\((.*?):(\d+):(\d+)\)$/);
    if (matchWithFunc) {
      frames.push({
        functionName: matchWithFunc[1] || 'anonymous',
        fileName: matchWithFunc[2],
        lineNumber: parseInt(matchWithFunc[3], 10),
        columnNumber: parseInt(matchWithFunc[4], 10),
        raw: trimmed,
      });
      continue;
    }

    // Pattern 2: "at filepath:line:col"
    const matchAnonymous = trimmed.match(/^(?:at\s+)?(.*?):(\d+):(\d+)$/);
    if (matchAnonymous) {
      frames.push({
        functionName: 'anonymous',
        fileName: matchAnonymous[1],
        lineNumber: parseInt(matchAnonymous[2], 10),
        columnNumber: parseInt(matchAnonymous[3], 10),
        raw: trimmed,
      });
      continue;
    }

    // Fallback for custom or single-line stack strings
    if (!trimmed.startsWith('Error') && !trimmed.startsWith('TypeError')) {
      frames.push({
        functionName: 'main',
        fileName: trimmed.replace(/^at\s+/, ''),
        lineNumber: null,
        columnNumber: null,
        raw: trimmed,
      });
    }
  }

  return frames;
}