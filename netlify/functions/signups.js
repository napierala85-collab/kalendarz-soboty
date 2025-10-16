import jwt from 'jsonwebtoken'
import { getStore } from '@netlify/blobs'

const STORE_NAME = 'signups-store'
const KEY = 'signups.json'

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

function withinTwoYears(dateStr) {
  const today = new Date()
  const end = new Date()
  end.setFullYear(end.getFullYear() + 2)
  const d = new Date(dateStr + 'T00:00:00')
  return d >= today && d <= end
}

export async function handler(event) {
  // auth for both read & write
  const authed = await auth(event)
  if (!authed) return bad(401, 'Unauthorized')

  const store = getStore(STORE_NAME)
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
    if (!withinTwoYears(date)) return bad(400, 'Date outside allowed range')

    const list = raw.signups[date] || []
    list.push({ name, note: note?.trim() || '', ts: Date.now() })
    raw.signups[date] = list

    await store.set(KEY, JSON.stringify(raw))

    return ok(raw)
  }

  return bad(405, 'Method Not Allowed')
}