export interface SnapTraceConfig {
  apiKey: string;
  endpoint?: string;
}

export function initSnapTrace(config: SnapTraceConfig): void;
export function captureException(error: Error | unknown): void;

declare const SnapTrace: {
  init: typeof initSnapTrace;
  captureException: typeof captureException;
};

export default SnapTrace;