/**
 * Guards on the marketplace's local HTTP API: the same-origin requirement
 * that stands between a page on another site and a plugin install, and the
 * bounded JSON body reader.
 */
import type { IncomingMessage } from 'node:http'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { assertMutationRequest, errorBody, HttpError, readJsonObject } from '../src/http.ts'

/** A request carrying only the fields the guards read. */
function request(method: string, headers: Record<string, string>): IncomingMessage {
  return { method, headers } as unknown as IncomingMessage
}

/** A readable body stream standing in for the incoming request. */
function body(text: string | Buffer): IncomingMessage {
  return Readable.from([Buffer.from(text)]) as unknown as IncomingMessage
}

/** Run a guard and return the HttpError it threw. */
function rejection(run: () => void): HttpError {
  try {
    run()
  } catch (error) {
    if (error instanceof HttpError) return error
    throw error
  }
  throw new Error('expected a rejection')
}

const SAME_ORIGIN = {
  origin: 'http://127.0.0.1:5173',
  host: '127.0.0.1:5173',
  'content-type': 'application/json',
}

describe('mutation request guard', () => {
  it('accepts a same-origin JSON POST', () => {
    expect(() => { assertMutationRequest(request('POST', SAME_ORIGIN)) }).not.toThrow()
  })

  it('rejects a cross-site POST even with a JSON content type', () => {
    const error = rejection(() => {
      assertMutationRequest(request('POST', { ...SAME_ORIGIN, origin: 'https://evil.example' }))
    })
    expect(error.status).toBe(403)
    expect(error.code).toBe('error.crossSite')
  })

  it('rejects a request whose Origin cannot be parsed', () => {
    const error = rejection(() => {
      assertMutationRequest(request('POST', { ...SAME_ORIGIN, origin: 'not a url' }))
    })
    expect(error.status).toBe(403)
    expect(error.code).toBe('error.crossSite')
  })

  it('rejects a request that omits Origin, which no browser fetch does', () => {
    const error = rejection(() => {
      assertMutationRequest(request('POST', { host: '127.0.0.1:5173', 'content-type': 'application/json' }))
    })
    expect(error.status).toBe(403)
    expect(error.code).toBe('error.originMissing')
  })

  it('rejects a same-origin GET, so no mutation is reachable by navigation', () => {
    const error = rejection(() => { assertMutationRequest(request('GET', SAME_ORIGIN)) })
    expect(error.status).toBe(405)
    expect(error.code).toBe('error.methodNotAllowed')
  })

  it('rejects a form content type, which a cross-site form could send', () => {
    const error = rejection(() => {
      assertMutationRequest(request('POST', { ...SAME_ORIGIN, 'content-type': 'application/x-www-form-urlencoded' }))
    })
    expect(error.status).toBe(415)
    expect(error.code).toBe('error.contentType')
  })

  it('treats a differing port as a different origin', () => {
    const error = rejection(() => {
      assertMutationRequest(request('POST', { ...SAME_ORIGIN, origin: 'http://127.0.0.1:9999' }))
    })
    expect(error.code).toBe('error.crossSite')
  })
})

describe('JSON body reader', () => {
  it('parses a JSON object', async () => {
    await expect(readJsonObject(body('{"action":"install"}'))).resolves.toEqual({ action: 'install' })
  })

  it('rejects a body over the 8 KiB cap', async () => {
    const oversized = `{"pad":"${'a'.repeat(8_193)}"}`
    await expect(readJsonObject(body(oversized))).rejects.toMatchObject({
      status: 413,
      code: 'error.bodyTooLarge',
    })
  })

  it('accepts a body at the cap', async () => {
    const padding = 8_192 - '{"pad":""}'.length
    await expect(readJsonObject(body(`{"pad":"${'a'.repeat(padding)}"}`))).resolves.toHaveProperty('pad')
  })

  it('rejects malformed JSON', async () => {
    await expect(readJsonObject(body('{'))).rejects.toMatchObject({
      status: 400,
      code: 'error.badJson',
    })
  })

  it('rejects a JSON array, which is not a field map', async () => {
    await expect(readJsonObject(body('[1,2]'))).rejects.toMatchObject({
      status: 400,
      code: 'error.bodyNotObject',
    })
  })

  it('rejects a JSON null', async () => {
    await expect(readJsonObject(body('null'))).rejects.toMatchObject({
      status: 400,
      code: 'error.bodyNotObject',
    })
  })
})

describe('error serialization', () => {
  it('carries the locale key and params for a raised failure', () => {
    const error = new HttpError(404, 'error.notInstalled', 'missing', { packageName: 'a', profile: 'web' })
    expect(errorBody(error)).toEqual({
      error: 'missing',
      code: 'error.notInstalled',
      params: { packageName: 'a', profile: 'web' },
    })
  })

  it('omits params when the failure has none', () => {
    expect(errorBody(new HttpError(400, 'error.actionInvalid', 'invalid action')))
      .toEqual({ error: 'invalid action', code: 'error.actionInvalid' })
  })

  it('sends no key for an unexpected throw, leaving the raw text as the fallback', () => {
    expect(errorBody(new Error('catalog fetch failed'))).toEqual({ error: 'catalog fetch failed' })
  })
})
