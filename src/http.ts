import type { IncomingMessage, ServerResponse } from 'node:http'

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
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

/** Require a same-origin browser POST before accepting a state change. */
export function assertMutationRequest(req: IncomingMessage): void {
  if (req.method !== 'POST') throw new HttpError(405, '仅支持 POST')
  const origin = req.headers.origin
  const host = req.headers.host
  if (origin === undefined || host === undefined) throw new HttpError(403, '缺少同源请求信息')
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, '拒绝跨站请求')
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(403, 'Origin 无效')
  }
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new HttpError(415, '请求体必须是 JSON')
  }
}

/** Parse a small JSON object body. */
export async function readJsonObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const value of req) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    size += chunk.length
    if (size > 8_192) throw new HttpError(413, '请求体过大')
    chunks.push(chunk)
  }
  let value: unknown
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'JSON 格式错误')
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, '请求体必须是对象')
  }
  return value as Record<string, unknown>
}
