import { credentialsConfigured, sendJson, sessionFromRequest } from './_auth.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!credentialsConfigured()) {
    return sendJson(res, 503, { configured: false, user: null }, { 'Cache-Control': 'no-store' })
  }

  const user = sessionFromRequest(req)
  return sendJson(res, user ? 200 : 401, { configured: true, user }, { 'Cache-Control': 'no-store' })
}
