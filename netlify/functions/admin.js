
export async function handler(event) {
  const ok = (data) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  const bad = (code, msg) => ({ statusCode: code, body: msg })

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
  const provided = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || ''

  if (!ADMIN_PASSWORD) return bad(500, 'ADMIN_PASSWORD not configured')
  if (provided && provided === ADMIN_PASSWORD) return ok({ ok: true })
  return bad(403, 'Forbidden')
}
