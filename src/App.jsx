import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Lock, UserPlus, Users, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'

const API_LOGIN = '/api/login'
const API_SIGNUPS = '/api/signups'

function formatDateISO(d) {
  return d.toISOString().slice(0,10)
}
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0,0,0,0)
  return x
}
function isSaturday(d) {
  return new Date(d).getDay() === 6
}

function generateSaturdaysTwoYears() {
  const today = startOfDay(new Date())
  const end = startOfDay(new Date(today))
  end.setFullYear(end.getFullYear() + 2)
  // go to next Saturday (or today if Saturday)
  let cur = startOfDay(new Date(today))
  while (cur.getDay() !== 6) cur = addDays(cur, 1)
  const dates = []
  while (cur < end) {
    dates.push(formatDateISO(cur))
    cur = addDays(cur, 7)
  }
  return dates
}

function Header({ onLogout }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-blue-600 text-white">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">Kalendarz sobót — zapisy</h1>
            <p className="text-xs text-slate-500">Publiczny (wewnętrzny) — dostęp po haśle</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn" title="Wyloguj">
          <LogOut size={16} /> Wyloguj
        </button>
      </div>
    </header>
  )
}

function PasswordGate({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (!res.ok) throw new Error('Nieprawidłowe hasło.')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      onLogin()
    } catch (err) {
      setError(err.message || 'Błąd logowania.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-2xl bg-slate-900 text-white">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Wymagane hasło</h2>
            <p className="text-sm text-slate-500">Podaj hasło, aby zobaczyć kalendarz.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Hasło</label>
            <input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Sprawdzanie…' : 'Zaloguj'}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function SignupModal({ date, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(API_SIGNUPS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ date, name, note })
      })
      if (!res.ok) throw new Error('Nie udało się zapisać.')
      const updated = await res.json()
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Błąd zapisu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="card max-w-md w-full relative">
        <button className="absolute right-4 top-4 text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-2xl bg-blue-600 text-white">
            <UserPlus size={18} />
          </div>
          <h3 className="text-lg font-semibold">Zapis na {date}</h3>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Imię i nazwisko</label>
            <input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Jan Kowalski" required />
          </div>
          <div>
            <label className="label">Notatka (opcjonalnie)</label>
            <input className="input mt-1" value={note} onChange={e=>setNote(e.target.value)} placeholder="np. zmiana poranna" />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Zapisz mnie'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-slate-500">Twoje dane widoczne będą dla osób mających hasło.</p>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [signups, setSignups] = useState({})
  const [modalDate, setModalDate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const saturdays = useMemo(() => generateSaturdaysTwoYears(), [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(API_SIGNUPS, { headers: { 'Authorization': 'Bearer ' + token } })
      if (res.status === 401) {
        setAuthed(false)
        return
      }
      if (!res.ok) throw new Error('Błąd pobierania danych.')
      const data = await res.json()
      setSignups(data.signups || {})
    } catch (err) {
      setError(err.message || 'Błąd')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // try auto-login (if token exists)
    const token = localStorage.getItem('token')
    if (token) {
      setAuthed(true)
      load()
    }
  }, [])

  if (!authed) {
    return <PasswordGate onLogin={() => { setAuthed(true); load() }} />
  }

  const nowYear = new Date().getFullYear()

  return (
    <div className="min-h-screen">
      <Header onLogout={() => { localStorage.removeItem('token'); setAuthed(false) }} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="badge">
                <Users size={14} className="mr-1" /> Zapisy współdzielone
              </div>
              <div className="badge">
                <CalendarDays size={14} className="mr-1" /> {nowYear} – {nowYear + 2}
              </div>
            </div>
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Dane są zapisywane w chmurze (Netlify).
            </div>
          </div>
        </div>

        {loading && <p>Ładowanie…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saturdays.map(date => {
            const people = signups[date] || []
            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-slate-500">Sobota</div>
                    <div className="text-lg font-semibold">{date}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setModalDate(date)}>
                    <UserPlus size={16} /> Zapisz się
                  </button>
                </div>
                {people.length === 0 ? (
                  <p className="text-sm text-slate-500">Brak chętnych</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {people.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        <span className="text-sm">{p.name}</span>
                        {p.note && <span className="badge">{p.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {modalDate && (
        <SignupModal
          date={modalDate}
          onClose={() => setModalDate(null)}
          onSaved={(data) => setSignups(data.signups || {})}
        />
      )}
    </div>
  )
}