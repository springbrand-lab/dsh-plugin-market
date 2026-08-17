import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Locale key the browser renders this failure with. The values mirror the
 * `error.*` keys in `src/client/locales.ts`; the `message` carried alongside
 * is English and exists for the DSH log, never for the UI.
 */
export type ErrorCode =
  | 'error.methodNotAllowed'
  | 'error.originMissing'
  | 'error.crossSite'
  | 'error.contentType'
  | 'error.bodyTooLarge'
  | 'error.badJson'
  | 'error.bodyNotObject'
  | 'error.fieldInvalid'
  | 'error.actionInvalid'
  | 'error.profileInvalid'
  | 'error.notInstallable'
  | 'error.packageNameInvalid'
  | 'error.notInstalled'
  | 'error.operationRunning'
  | 'error.restartPending'

export class HttpError extends Error {
  /**
   * @param status - HTTP status sent to the browser.
   * @param code - locale key the browser renders.
   * @param message - English text for the DSH log.
   * @param params - substitutions for the localized template.
   */
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly params?: Record<string, string>,
  ) {
    super(message)
  }
}

export function sendJson(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

/**
 * Serialize a failure for the browser: the locale key and its substitutions
 * when the failure is one this plugin raised, plus the English text as the
 * fallback for anything else (an unexpected throw has no key to translate).
 */
export function errorBody(error: unknown): { error: string; code?: ErrorCode; params?: Record<string, string> } {
  const message = error instanceof Error ? error.message : String(error)
  if (!(error instanceof HttpError)) return { error: message }
  return {
    error: message,
    code: error.code,
    ...(error.params === undefined ? {} : { params: error.params }),
  }
}

/** Require a same-origin browser POST before accepting a state change. */
export function assertMutationRequest(req: IncomingMessage): void {
  if (req.method !== 'POST') throw new HttpError(405, 'error.methodNotAllowed', 'POST only')
  const origin = req.headers.origin
  const host = req.headers.host
  if (origin === undefined || host === undefined) {
    throw new HttpError(403, 'error.originMissing', 'missing same-origin request headers')
  }
  try {
    if (new URL(origin).host !== host) {
      throw new HttpError(403, 'error.crossSite', 'cross-site request rejected')
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(403, 'error.crossSite', 'invalid Origin header')
  }
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new HttpError(415, 'error.contentType', 'request body must be JSON')
  }
}

/** Parse a small JSON object body. */
export async function readJsonObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const value of req) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    size += chunk.length
    if (size > 8_192) throw new HttpError(413, 'error.bodyTooLarge', 'request body too large')
    chunks.push(chunk)
  }
  let value: unknown
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'error.badJson', 'malformed JSON')
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, 'error.bodyNotObject', 'request body must be an object')
  }
  return value as Record<string, unknown>
}
