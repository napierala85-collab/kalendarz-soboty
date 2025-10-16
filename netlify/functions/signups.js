
import jwt from 'jsonwebtoken'
import { getStore } from '@netlify/blobs'

const STORE_NAME = 'signups-store'
const KEY = 'signups.json'
function getStoreSafe() {
  // In Netlify production, Blobs should be auto-configured.
  // For local dev or misconfigured sites, allow manual configuration via env.
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID
  const token  = process.env.NETLIFY_AUTH_TOKEN || process.env.BLOBS_TOKEN
  try {
    return getStore({ name: STORE_NAME, siteID, token })
  } catch (e) {
    // Some older versions expect positional signature; try fallback
    try {
      if (siteID && token) {
        return getStore({ name: STORE_NAME, siteID, token })
      }
    } catch {}
    // Last resort: default form (will throw if not configured on site)
    return getStore(STORE_NAME)
  }
}

function ok(data) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}
function bad(status, msg) {
  return { statusCode: status, body: msg }
}

async function auth(event) {
  const JWT_SECRET = process.env.JWT_SECRET || 'change-me-secret'
  const authz = event.headers.authorization || event.headers.Authorization || ''
  const token = (authz.startsWith('Bearer ') ? authz.slice(7) : null)
  if (!token) return null
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return null
  }
}

function isSaturday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDay() === 6
}

function withinUntil2030(dateStr) {
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  const end = new Date(2030, 11, 31, 0, 0, 0, 0) // 2030-12-31
  return d >= today && d <= end
}

function isAdmin(event) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
  const provided = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || ''
  return ADMIN_PASSWORD && provided && ADMIN_PASSWORD === provided
}

export async function handler(event) {
  const authed = await auth(event)
  if (!authed) return bad(401, 'Unauthorized')

  const store = getStoreSafe()
  let raw = await store.get(KEY, { type: 'json' })
  if (!raw) raw = { signups: {} }

  if (event.httpMethod === 'GET') {
    return ok(raw)
  }

  if (event.httpMethod === 'POST') {
    const { date, name, note } = JSON.parse(event.body || '{}')
    if (!date || !name) return bad(400, 'Missing fields')
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) return bad(400, 'Invalid date format')
    if (!isSaturday(date)) return bad(400, 'Date must be a Saturday')
    if (!withinUntil2030(date)) return bad(400, 'Date outside allowed range (today → 2030-12-31)')

    const list = raw.signups[date] || []
    list.push({ name, note: (note||'').trim(), ts: Date.now() })
    raw.signups[date] = list

    await store.set(KEY, JSON.stringify(raw))
    return ok(raw)
  }

  // Admin-only: edit (PUT) and delete (DELETE)
  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    if (!isAdmin(event)) return bad(403, 'Admin password required')
    const { date, ts, name, note } = JSON.parse(event.body || '{}')
    if (!date || !ts) return bad(400, 'Missing date or ts')
    const list = raw.signups[date] || []
    const idx = list.findIndex(x => String(x.ts) === String(ts))
    if (idx === -1) return bad(404, 'Entry not found')
    if (typeof name === 'string') list[idx].name = name
    if (typeof note === 'string') list[idx].note = note
    await store.set(KEY, JSON.stringify(raw))
    return ok(raw)
  }

  if (event.httpMethod === 'DELETE') {
    if (!isAdmin(event)) return bad(403, 'Admin password required')
    const payload = JSON.parse(event.body || '{}')
    const { date, ts } = payload
    if (!date || !ts) return bad(400, 'Missing date or ts')
    const list = raw.signups[date] || []
    const idx = list.findIndex(x => String(x.ts) === String(ts))
    if (idx === -1) return bad(404, 'Entry not found')
    list.splice(idx, 1)
    raw.signups[date] = list
    await store.set(KEY, JSON.stringify(raw))
    return ok(raw)
  }

  return bad(405, 'Method Not Allowed')
}
