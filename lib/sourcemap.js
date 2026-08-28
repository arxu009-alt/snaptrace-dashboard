import { SourceMapConsumer } from 'source-map-js'

/**
 * Resolves a minified stack trace line back to original source position
 * @param {string} rawStack - Raw minified stack trace string
 * @param {object|string} rawSourceMap - Raw source map JSON object or string
 */
export async function resolveStackTrace(rawStack, rawSourceMap) {
  if (!rawStack || !rawSourceMap) return rawStack

  try {
    const rawMapJson = typeof rawSourceMap === 'string' ? JSON.parse(rawSourceMap) : rawSourceMap
    const consumer = await new SourceMapConsumer(rawMapJson)

    // Regex to match "at FunctionName (url:line:col)" or "at url:line:col"
    const stackLineRegex = /(?:at\s+(.*?)\s+\()?https?:\/\/[^\/]+(\/[^\s:]+):(\d+):(\d+)\)?/g

    const resolvedStack = rawStack.replace(stackLineRegex, (match, fnName, path, line, col) => {
      const original = consumer.originalPositionFor({
        line: parseInt(line, 10),
        column: parseInt(col, 10)
      })

      if (original && original.source) {
        const caller = fnName || original.name || 'anonymous'
        return `at ${caller} (${original.source}:${original.line}:${original.column})`
      }

      return match
    })

    return resolvedStack
  } catch (err) {
    console.error('[SourceMap Engine] Failed to resolve stack trace:', err)
    return rawStack // Fallback to raw stack trace if demangling fails
  }
}