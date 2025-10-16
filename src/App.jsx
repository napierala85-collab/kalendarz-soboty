import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Lock, UserPlus, Users, LogOut, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2, Shield } from 'lucide-react'

const API_LOGIN = '/api/login'
const API_SIGNUPS = '/api/signups'

function ymdLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfDayLocal(d) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x }
function isSaturday(d) { return new Date(d).getDay() === 6 }

// Saturdays from today to 2030-12-31
function allSaturdaysTo2030() {
  const today = startOfDayLocal(new Date())
  const end = new Date(2030,11,31,0,0,0,0)
  let cur = new Date(today)
  while (cur.getDay() !== 6) cur = addDays(cur,1)
  const out = []
  while (cur <= end) { out.push(ymdLocal(cur)); cur = addDays(cur,7) }
  return out
}

// UI helpers
function formatTs(ts) {
  try { return new Date(ts).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return '' }
}
function cutoffForSaturdayLocal(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const fri = new Date(d); fri.setDate(fri.getDate()-1); fri.setHours(11,0,0,0)
  return fri
}
function isLocked(dateStr) { return new Date() >= cutoffForSaturdayLocal(dateStr) }

function Header({ onLogout }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-blue-600 text-white"><CalendarDays size={20} /></div>
          <div>
            <h1 className="font-semibold text-slate-900">Kalendarz sobót — zapisy</h1>
            <p className="text-xs text-slate-500">Publiczny (wewnętrzny) — dostęp po haśle</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn" title="Wyloguj"><LogOut size={16} /> Wyloguj</button>
      </div>
    </header>
  )
}

function PasswordGate({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch(API_LOGIN, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) })
      if (!res.ok) throw new Error('Nieprawidłowe hasło.')
      const data = await res.json(); localStorage.setItem('token', data.token); onLogin()
    } catch (err) { setError(err.message || 'Błąd logowania.') } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-2xl bg-slate-900 text-white"><Lock size={18} /></div>
          <div><h2 className="text-lg font-semibold">Wymagane hasło</h2><p className="text-sm text-slate-500">Podaj hasło, aby zobaczyć kalendarz.</p></div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Hasło</label><input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Sprawdzanie…' : 'Zaloguj'}</button>
          {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16} /> {error}</div>}
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
    e.preventDefault(); setSaving(true); setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(API_SIGNUPS, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ date, name, note })
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json(); onSaved(updated); onClose()
    } catch (err) { setError(err.message || 'Błąd zapisu.') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="card max-w-md w-full relative">
        <button className="absolute right-4 top-4 text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-2xl bg-blue-600 text-white"><UserPlus size={18} /></div><h3 className="text-lg font-semibold">Zapis na {date}</h3></div>
        <form onSubmit={save} className="space-y-3">
          <div><label className="label">Imię i nazwisko</label><input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Jan Kowalski" required /></div>
          <div><label className="label">Notatka (opcjonalnie)</label><input className="input mt-1" value={note} onChange={e=>setNote(e.target.value)} placeholder="np. zmiana poranna" /></div>
          <button className="btn btn-primary w-full" disabled={saving || isLocked(date)}>{saving ? 'Zapisywanie…' : (isLocked(date) ? 'Lista zamknięta' : 'Zapisz mnie')}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-slate-500">Twoje dane widoczne będą dla osób mających hasło.</p>
        </form>
      </div>
    </div>
  )
}

function AdminBar({ adminEnabled, onSetAdmin }) {
  const [val, setVal] = useState('')
  return (
    <div className="card flex items-center gap-3">
      <div className="p-2 rounded-2xl bg-purple-600 text-white"><Shield size={18} /></div>
      <div className="flex-1">
        <div className="text-sm text-slate-600">Tryb administratora</div>
        {adminEnabled ? <div className="text-sm">Aktywny — możesz edytować i usuwać wpisy.</div> : <div className="text-sm">Podaj hasło admina, aby aktywować.</div>}
      </div>
      {!adminEnabled && (
        <form onSubmit={(e)=>{e.preventDefault(); onSetAdmin(val);}} className="flex items-center gap-2">
          <input className="input" type="password" placeholder="Hasło admina" value={val} onChange={e=>setVal(e.target.value)} />
          <button className="btn btn-primary">Aktywuj</button>
        </form>
      )}
      {adminEnabled && <div className="badge">ADMIN</div>}
    </div>
  )
}

function EditModal({ date, entry, onClose, onSaved }) {
  const [name, setName] = useState(entry?.name || '')
  const [note, setNote] = useState(entry?.note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const adminPass = localStorage.getItem('adminPass') || ''
      const res = await fetch(API_SIGNUPS, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token, 'X-Admin-Password': adminPass },
        body: JSON.stringify({ date, ts: entry.ts, name, note })
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json(); onSaved(updated); onClose()
    } catch (err) { setError(err.message || 'Błąd') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="card max-w-md w-full relative">
        <button className="absolute right-4 top-4 text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        <h3 className="text-lg font-semibold mb-3">Edytuj wpis ({date})</h3>
        <form onSubmit={save} className="space-y-3">
          <div><label className="label">Imię i nazwisko</label><input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} required /></div>
          <div><label className="label">Notatka</label><input className="input mt-1" value={note} onChange={e=>setNote(e.target.value)} /></div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz zmiany'}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [signups, setSignups] = useState({})
  const [modalDate, setModalDate] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [adminEnabled, setAdminEnabled] = useState(!!localStorage.getItem('adminPass'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allSaturdays = useMemo(() => allSaturdaysTo2030(), [])
  const years = useMemo(() => {
    const ys = new Set(allSaturdays.map(d => Number(d.slice(0,4))))
    return Array.from(ys).sort((a,b)=>a-b)
  }, [allSaturdays])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const monthSaturdays = useMemo(() => {
    return allSaturdays.filter(d => Number(d.slice(0,4)) === year && Number(d.slice(5,7)) === (month+1))
  }, [allSaturdays, year, month])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(API_SIGNUPS, { headers: { 'Authorization':'Bearer '+token } })
      if (res.status === 401) { setAuthed(false); return }
      if (!res.ok) throw new Error('Błąd pobierania danych.')
      const data = await res.json(); setSignups(data.signups || {})
    } catch (err) { setError(err.message || 'Błąd') } finally { setLoading(false) }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) { setAuthed(true); load() }
  }, [])

  if (!authed) return <PasswordGate onLogin={() => { setAuthed(true); load() }} />

  const minYear = years[0] || today.getFullYear()
  const maxYear = 2030

  return (
    <div className="min-h-screen">
      <Header onLogout={() => { localStorage.removeItem('token'); setAuthed(false) }} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <AdminBar adminEnabled={adminEnabled} onSetAdmin={(v)=>{ localStorage.setItem('adminPass', v); setAdminEnabled(true); }} />

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="badge"><Users size={14} className="mr-1" /> Zapisy współdzielone</div>
              <div className="badge"><CalendarDays size={14} className="mr-1" /> do 2030</div>
            </div>
            <div className="text-sm text-slate-600 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-600" /> Dane są zapisywane w chmurze (Netlify).</div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between gap-3">
              <button className="btn" onClick={()=>{ if(month===0){ if(year>minYear){ setYear(year-1); setMonth(11) } } else { setMonth(month-1) } }}><ChevronLeft size={16} /> Poprzedni</button>
              <div className="text-lg font-semibold">{['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'][month]} {year}</div>
              <button className="btn" onClick={()=>{ if(month===11){ if(year<maxYear){ setYear(year+1); setMonth(0) } } else { setMonth(month+1) } }}>Następny <ChevronRight size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
              <label className="label">Rok:</label>
              <select className="input" value={year} onChange={e=>setYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <label className="label ml-3">Miesiąc:</label>
              <select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))}>
                {['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'].map((m,i)=>(
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <p>Ładowanie…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthSaturdays.length === 0 ? (
            <div className="col-span-full text-sm text-slate-500">Brak sobót w tym miesiącu.</div>
          ) : monthSaturdays.map(date => {
            const people = signups[date] || []
            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-slate-500">Sobota</div>
                    <div className="text-lg font-semibold">{date}</div>
                    <div className="text-xs text-slate-500 mt-1">Lista zamykana: {cutoffForSaturdayLocal(date).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setModalDate(date)} disabled={isLocked(date)}>
                    <UserPlus size={16} /> {isLocked(date) ? 'Lista zamknięta' : 'Zapisz się'}
                  </button>
                </div>
                {isLocked(date) && <div className="text-xs text-red-600 mb-2">Lista zamknięta (piątek 11:00).</div>}
                {people.length === 0 ? (
                  <p className="text-sm text-slate-500">Brak chętnych</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {people.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        <span className="text-sm">{p.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({formatTs(p.ts)})</span>
                        {p.note && <span className="badge">{p.note}</span>}
                        {adminEnabled && (
                          <span className="ml-auto flex items-center gap-2">
                            <button className="btn" title="Edytuj" onClick={()=>{ setEditItem({date, entry:p}); }}><Pencil size={14} /></button>
                            <button className="btn" title="Usuń" onClick={async()=>{
                              const ok = confirm('Usunąć ten wpis?')
                              if (!ok) return
                              const token = localStorage.getItem('token') || ''
                              const adminPass = localStorage.getItem('adminPass') || ''
                              const res = await fetch(API_SIGNUPS, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-Admin-Password': adminPass },
                                body: JSON.stringify({ date, ts: p.ts })
                              })
                              if (res.ok) { const updated = await res.json(); setSignups(updated.signups || {}) }
                              else { alert(await res.text()) }
                            }}><Trash2 size={14} /></button>
                          </span>
                        )}
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
        <SignupModal date={modalDate} onClose={() => setModalDate(null)} onSaved={(data) => setSignups(data.signups || {})} />
      )}
      {editItem && (
        <EditModal date={editItem.date} entry={editItem.entry} onClose={()=>setEditItem(null)} onSaved={(data)=>{ setSignups(data.signups || {}); setEditItem(null); }} />
      )}
    </div>
  )
}