import { clearedSessionCookie, sendJson } from './_auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearedSessionCookie(), 'Cache-Control': 'no-store' })
}
