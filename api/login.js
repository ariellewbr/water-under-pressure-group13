import { authenticate, createSessionToken, credentialsConfigured, sendJson, sessionCookie } from './_auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!credentialsConfigured()) {
    return sendJson(res, 503, { error: 'Authentication is not configured on this deployment.' })
  }

  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 128 || password.length > 1024) {
    return sendJson(res, 400, { error: 'Username and password are required.' })
  }

  const user = authenticate(username, password)
  if (!user) return sendJson(res, 401, { error: 'Invalid username or password.' })

  const token = createSessionToken(user.username)
  return sendJson(res, 200, { user }, { 'Set-Cookie': sessionCookie(token), 'Cache-Control': 'no-store' })
}
