import jwt from 'jsonwebtoken'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const { password } = JSON.parse(event.body || '{}')
  const SITE_PASSWORD = process.env.SITE_PASSWORD
  const JWT_SECRET = process.env.JWT_SECRET || 'change-me-secret'
  if (!SITE_PASSWORD) return { statusCode: 500, body: 'Server not configured (SITE_PASSWORD missing).' }
  if (password !== SITE_PASSWORD) return { statusCode: 401, body: 'Unauthorized' }
  const token = jwt.sign({ typ: 'session' }, JWT_SECRET, { expiresIn: '30d' })
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }
}