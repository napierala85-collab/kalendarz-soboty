
import React, { useEffect, useMemo, useState } from 'react'
import { Lock, LogOut, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2, Shield, Clock, Info, PlusCircle } from 'lucide-react'

const API_LOGIN = '/api/login'
const API_SIGNUPS = '/api/signups'
const API_ADMIN = '/api/admin'

function ymdLocal(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
function startOfDayLocal(d){ const x=new Date(d); x.setHours(0,0,0,0); return x }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x }
function fmtDatePL(s){ return `${s.slice(8,10)}-${s.slice(5,7)}-${s.slice(0,4)}` }
function allSaturdaysTo2030(){ const today=startOfDayLocal(new Date()); const end=new Date(2030,11,31,0,0,0,0); let cur=new Date(today); while(cur.getDay()!==6) cur=addDays(cur,1); const out=[]; while(cur<=end){ out.push(ymdLocal(cur)); cur=addDays(cur,7) } return out }
function formatTs(ts){ try{ return new Date(ts).toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'}) }catch{ return '' } }
function cutoffForSaturdayLocal(dateStr){ const d=new Date(dateStr+'T00:00:00'); const fri=new Date(d); fri.setDate(fri.getDate()-1); fri.setHours(15,0,0,0); return fri }
function isLocked(dateStr, now){ return now >= cutoffForSaturdayLocal(dateStr) }
function fmtCountdown(ms){ if(ms<=0) return 'Zamknięte'; const s=Math.floor(ms/1000); const d=Math.floor(s/86400); const h=Math.floor((s%86400)/3600); const m=Math.floor((s%3600)/60); const pad=n=>String(n).padStart(2,'0'); return d>0?`${d} d ${pad(h)} h ${pad(m)} m`:`${h} h ${pad(m)} m` }

function Header({ onLogout }){
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Alasta" className="h-8 md:h-10 w-auto" />
          <div className="text-lg font-semibold tracking-wide">Alasta Soboty</div>
        </div>
        <button onClick={onLogout} className="btn" title="Wyloguj"><LogOut size={16}/> Wyloguj</button>
      </div>
    </header>
  )
}

function AdminBar({ adminEnabled, setAdminEnabled, setAdminError }){
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)

  const tryEnable = async (e) => {
    e.preventDefault()
    setLoading(true); setAdminError('')
    try {
      const res = await fetch(API_ADMIN, { headers: { 'X-Admin-Password': val } })
      if (!res.ok) throw new Error('Nieprawidłowe hasło admina')
      localStorage.setItem('adminPass', val)
      setAdminEnabled(true)
    } catch (err) {
      localStorage.removeItem('adminPass')
      setAdminEnabled(false)
      setAdminError(err.message || 'Błąd weryfikacji admina')
    } finally {
      setLoading(false)
    }
  }

  const disable = () => {
    localStorage.removeItem('adminPass')
    setAdminEnabled(false)
    setAdminError('')
  }

  return (
    <div className="card flex items-center gap-3">
      <div className="p-2 rounded-2xl bg-purple-600 text-white"><Shield size={18}/></div>
      <div className="flex-1">
        <div className="text-sm text-slate-600">Tryb administratora</div>
        {adminEnabled ? <div className="text-sm">Aktywny — dodawanie/edycja/usuwanie tylko przez admina.</div> : <div className="text-sm">Podaj hasło admina, aby aktywować.</div>}
      </div>
      {!adminEnabled ? (
        <form onSubmit={tryEnable} className="flex items-center gap-2">
          <input className="input" type="password" placeholder="Hasło admina" value={val} onChange={e=>setVal(e.target.value)} />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Sprawdzanie…' : 'Aktywuj'}</button>
        </form>
      ) : (
        <button className="btn" onClick={disable}>Wyłącz tryb admina</button>
      )}
    </div>
  )
}

function PasswordGate({ onLogin }){
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const submit=async(e)=>{ e.preventDefault(); setLoading(true); setError(''); try{
    const res=await fetch(API_LOGIN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})})
    if(!res.ok) throw new Error('Nieprawidłowe hasło.')
    const data=await res.json(); localStorage.setItem('token',data.token); onLogin()
  }catch(err){ setError(err.message||'Błąd logowania.') }finally{ setLoading(false) } }
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-2xl bg-slate-900 text-white"><Lock size={18}/></div>
          <div><h2 className="text-lg font-semibold">Wymagane hasło</h2><p className="text-sm text-slate-500">Podaj hasło, aby zobaczyć kalendarz.</p></div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Hasło</label><input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
          <button className="btn btn-primary w-full" disabled={loading}>{loading?'Sprawdzanie…':'Zaloguj'}</button>
          {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16}/> {error}</div>}
        </form>
      </div>
    </div>
  )
}

function SignupModal({ date, onClose, onSaved, adminEnabled }){
  const [name,setName]=useState('')
  const [note,setNote]=useState('')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const save=async(e)=>{ e.preventDefault(); setSaving(true); setError(''); try{
    const token=localStorage.getItem('token')||''
    const adminPass=localStorage.getItem('adminPass')||''
    const res=await fetch(API_SIGNUPS,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-Admin-Password':adminPass},body:JSON.stringify({date,name,note})})
    if(!res.ok) throw new Error(await res.text())
    const updated=await res.json(); onSaved(updated); onClose()
  }catch(err){ setError(err.message||'Błąd zapisu.') }finally{ setSaving(false) } }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="card max-w-md w-full relative">
        <button className="absolute right-4 top-4 text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-2xl bg-blue-600 text-white"><PlusCircle size={18}/></div><h3 className="text-lg font-semibold">Dodaj osobę na {fmtDatePL(date)}</h3></div>
        <div className="alert-banner alert-warning"><Clock size={16}/><span>Poza standardowym czasem zapisów — dostępne dla admina.</span></div>
        {!adminEnabled ? <p className="text-sm text-red-600 mt-2">Dodawanie dostępne tylko dla administratora.</p> : null}
        <form onSubmit={save} className="space-y-3 mt-3">
          <div><label className="label">Imię i nazwisko</label><input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} required/></div>
          <div><label className="label">Notatka (opcjonalnie)</label><input className="input mt-1" value={note} onChange={e=>setNote(e.target.value)} placeholder="np. zmiana poranna"/></div>
          <button className="btn btn-primary w-full" disabled={saving || !adminEnabled}>{saving ? 'Zapisywanie…' : 'Dodaj osobę'}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  )
}

function EditModal({ date, entry, onClose, onSaved }){
  const [name,setName]=useState(entry?.name||'')
  const [note,setNote]=useState(entry?.note||'')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const save=async(e)=>{ e.preventDefault(); setSaving(true); setError(''); try{
    const token=localStorage.getItem('token')||''
    const adminPass=localStorage.getItem('adminPass')||''
    const res=await fetch(API_SIGNUPS,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-Admin-Password':adminPass},body:JSON.stringify({date,ts:entry.ts,name,note})})
    if(!res.ok) throw new Error(await res.text())
    const updated=await res.json(); onSaved(updated); onClose()
  }catch(err){ setError(err.message||'Błąd') }finally{ setSaving(false) } }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="card max-w-md w-full relative">
        <button className="absolute right-4 top-4 text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        <h3 className="text-lg font-semibold mb-3">Edytuj wpis ({fmtDatePL(date)})</h3>
        <form onSubmit={save} className="space-y-3">
          <div><label className="label">Imię i nazwisko</label><input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} required/></div>
          <div><label className="label">Notatka</label><input className="input mt-1" value={note} onChange={e=>setNote(e.target.value)}/></div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving?'Zapisywanie…':'Zapisz zmiany'}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  )
}

function PlanEditor({ allSaturdays, plans, canEdit, onSave }){
  const upcoming = useMemo(()=>allSaturdays[0], [allSaturdays])
  const [date,setDate]=useState(upcoming)
  const [text,setText]=useState(plans[date]||'')
  useEffect(()=>{ setText(plans[date]||'') },[date,plans])

  const save = async () => {
    await onSave(date, text)
    alert('Zapisano plan dla: ' + date)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="label">Soboty:</label>
          <select className="input" value={date} onChange={e=>setDate(e.target.value)}>
            {allSaturdays.map(d => <option key={d} value={d}>{fmtDatePL(d)}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-600">{plans[date] ? 'Plan opublikowany' : 'Brak planu'}</div>
      </div>

      {canEdit ? (
        <div className="mt-3 space-y-2">
          <textarea className="input min-h-[120px]" value={text} onChange={e=>setText(e.target.value)} placeholder="Wpisz plan pracy w sobotę... (widoczny dla wszystkich po zapisaniu)"></textarea>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}>Zapisz plan</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{plans[date]||'— Brak planu —'}</div>
      )}
    </div>
  )
}

export default function App(){
  const [authed,setAuthed]=useState(false)
  const [signups,setSignups]=useState({})
  const [plans,setPlans]=useState({})
  const [modalDate,setModalDate]=useState(null)
  const [editItem,setEditItem]=useState(null)
  const [adminEnabled,setAdminEnabled]=useState(!!localStorage.getItem('adminPass'))
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [now,setNow]=useState(new Date())
  const [adminError,setAdminError]=useState('')

  useEffect(()=>{ const id=setInterval(()=>setNow(new Date()),30000); return ()=>clearInterval(id) },[])

  const allSaturdays=useMemo(()=>allSaturdaysTo2030(),[])
  const years=useMemo(()=>{ const ys=new Set(allSaturdays.map(d=>+d.slice(0,4))); return Array.from(ys).sort((a,b)=>a-b) },[allSaturdays])

  const today=new Date()
  const [year,setYear]=useState(today.getFullYear())
  const [month,setMonth]=useState(today.getMonth())

  const monthSaturdays=useMemo(()=>allSaturdays.filter(d=>+d.slice(0,4)===year && +d.slice(5,7)===(month+1)),[allSaturdays,year,month])

  const load=async()=>{ setLoading(true); setError(''); try{
    const token=localStorage.getItem('token')||''
    const res=await fetch(API_SIGNUPS,{headers:{'Authorization':'Bearer '+token}})
    if(res.status===401){ setAuthed(false); return }
    if(!res.ok) throw new Error('Błąd pobierania danych.')
    const data=await res.json()
    setSignups(data.signups||{})
    setPlans(data.plans||{})
  }catch(err){ setError(err.message||'Błąd') }finally{ setLoading(false) } }

  useEffect(()=>{ const t=localStorage.getItem('token'); if(t){ setAuthed(true); load() } },[])
  if(!authed) return <PasswordGate onLogin={()=>{ setAuthed(true); load() }}/>

  const minYear=years[0]||today.getFullYear()
  const maxYear=2030

  const savePlan = async (date, text) => {
    const token=localStorage.getItem('token')||''
    const adminPass=localStorage.getItem('adminPass')||''
    const res=await fetch(API_SIGNUPS,{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-Admin-Password':adminPass},
      body: JSON.stringify({ mode:'plan', date, plan:text })
    })
    if(!res.ok) throw new Error(await res.text())
    const data=await res.json()
    setPlans(data.plans||{})
  }

  return (
    <div className="min-h-screen">
      <Header onLogout={()=>{ localStorage.removeItem('token'); setAuthed(false) }}/>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        <AdminBar adminEnabled={adminEnabled} setAdminEnabled={setAdminEnabled} setAdminError={setAdminError} />
        {adminError && <div className="text-sm text-red-600">{adminError}</div>}

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between gap-3">
              <button className="btn" onClick={()=>{ if(month===0){ if(year>minYear){ setYear(year-1); setMonth(11) } } else { setMonth(month-1) } }}><ChevronLeft size={16}/> Poprzedni</button>
              <div className="text-lg font-semibold">{['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'][month]} {year}</div>
              <button className="btn" onClick={()=>{ if(month===11){ if(year<maxYear){ setYear(year+1); setMonth(0) } } else { setMonth(month+1) } }}>Następny <ChevronRight size={16}/></button>
            </div>
            <div className="flex items-center gap-2">
              <label className="label">Rok:</label>
              <select className="input" value={year} onChange={e=>setYear(+e.target.value)}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              <label className="label ml-3">Miesiąc:</label>
              <select className="input" value={month} onChange={e=>setMonth(+e.target.value)}>{['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'].map((m,i)=><option key={m} value={i}>{m}</option>)}</select>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthSaturdays.length===0 ? (
            <div className="col-span-full text-sm text-slate-500">Brak sobót w tym miesiącu.</div>
          ) : monthSaturdays.map(date=>{
            const people = signups[date] || []
            const locked = isLocked(date, now)
            const cutoff = cutoffForSaturdayLocal(date)
            const countdown = fmtCountdown(cutoff - now)
            return (
              <div key={date} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-slate-500">Sobota</div>
                    <div className="text-lg font-semibold">{fmtDatePL(date)}</div>
                    <div className={`alert-banner ${locked ? 'alert-danger' : 'alert-warning'}`}>
                      <Clock size={18}/><span>Lista zamykana: {cutoff.toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'})}</span>
                    </div>
                  </div>
                  {adminEnabled ? (
                    <button className="btn btn-primary" onClick={()=>setModalDate(date)}>
                      <PlusCircle size={16}/> Dodaj osobę
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 mt-2">Zapisy dodaje administrator.</div>
                  )}
                </div>
                <div className="summary">
                  <span><strong>Chętni:</strong> {people.length}</span>
                  <span className="countdown"><strong>Do zamknięcia:</strong> {countdown}</span>
                </div>
                {people.length===0 ? (
                  <p className="text-sm text-slate-500 mt-2">Brak chętnych</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {people.map((p,i)=>(
                      <li key={i} className="entry-line">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0"></span>
                        <span className="entry-name">{p.name}</span>
                        <span className="entry-meta">({formatTs(p.ts)})</span>
                        {p.note && <span className="entry-note">— {p.note}</span>}
                        {adminEnabled && (
                          <span className="entry-actions">
                            <button className="icon-btn-lg" title="Edytuj" onClick={()=>setEditItem({date,entry:p})}><Pencil size={18}/></button>
                            <button className="icon-btn-lg" title="Usuń" onClick={async()=>{
                              if(!confirm('Usunąć ten wpis?')) return
                              const token=localStorage.getItem('token')||''
                              const adminPass=localStorage.getItem('adminPass')||''
                              const res=await fetch(API_SIGNUPS,{method:'DELETE',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-Admin-Password':adminPass},body:JSON.stringify({date,ts:p.ts})})
                              if(res.ok){ const updated=await res.json(); setSignups(updated.signups||{}) } else { alert(await res.text()) }
                            }}><Trash2 size={18}/></button>
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

        {/* Plan section */}
        <div className="card">
          <div className="text-lg font-semibold mb-2 flex items-center gap-2"><Info size={18}/> Plan pracy w sobotę</div>
          <p className="text-sm text-slate-600 mb-3">Wybierz sobotę, aby zobaczyć/edytować plan dnia.</p>
          <PlanEditor allSaturdays={allSaturdays} plans={plans} canEdit={adminEnabled} onSave={(...args)=>{return (async()=>{await savePlan(...args)})()}} />
        </div>
      </main>

      {modalDate && <SignupModal date={modalDate} adminEnabled={adminEnabled} onClose={()=>setModalDate(null)} onSaved={(data)=>{ setSignups(data.signups||{}); }}/>
      }
      {editItem && <EditModal date={editItem.date} entry={editItem.entry} onClose={()=>setEditItem(null)} onSaved={(data)=>{ setSignups(data.signups||{}); }}/>
      }
    </div>
  )
}
