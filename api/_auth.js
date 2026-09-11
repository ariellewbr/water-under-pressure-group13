import crypto from 'node:crypto'

const COOKIE_NAME = 'rup_session'
const SESSION_SECONDS = 8 * 60 * 60

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function sign(input, secret) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url')
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=')
    return index === -1 ? [part, ''] : [part.slice(0, index), part.slice(index + 1)]
  }))
}

function verifyPassword(password, stored) {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex)) return false
  const actual = crypto.scryptSync(password, salt, expectedHex.length / 2)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function credentialsConfigured() {
  return Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD_HASH && process.env.AUTH_JWT_SECRET)
}

export function authenticate(username, password) {
  const configuredUsername = required('AUTH_USERNAME')
  const passwordHash = required('AUTH_PASSWORD_HASH')
  if (username !== configuredUsername || !verifyPassword(password, passwordHash)) return null
  return { username: configuredUsername }
}

export function createSessionToken(username) {
  const secret = required('AUTH_JWT_SECRET')
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub: username, iat: now, exp: now + SESSION_SECONDS }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64Url(JSON.stringify(payload))
  return `${header}.${body}.${sign(`${header}.${body}`, secret)}`
}

export function verifySessionToken(token) {
  const secret = required('AUTH_JWT_SECRET')
  const parts = token?.split('.')
  if (!parts || parts.length !== 3) return null
  const [header, body, signature] = parts
  const expectedSignature = sign(`${header}.${body}`, secret)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null

  try {
    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') return null
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null
    return { username: payload.sub }
  } catch {
    return null
  }
}

export function sessionFromRequest(req) {
  if (!credentialsConfigured()) return null
  const token = parseCookies(req.headers.cookie).rup_session
  return token ? verifySessionToken(token) : null
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`
}

export function clearedSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function sendJson(res, status, body, headers = {}) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
  res.end(JSON.stringify(body))
}
