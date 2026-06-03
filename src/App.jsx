import { useState, useEffect, useMemo } from 'react'
import { register, login, checkSubscription, initiatePayment, checkPaymentStatus } from './api.js'

const NOTES = Array.from({ length: 21 }, (_, i) => i)
const DAY_LABELS = ['1er jour', '2ème jour', '3ème jour', '4ème jour']
const emptyDay = () => ({
  matin: Object.fromEntries(NOTES.map(n => [n, ''])),
  soir: Object.fromEntries(NOTES.map(n => [n, '']))
})
const emptyForm = () => ({
  discipline: '', ccd: '', orena: '', correcteur: '',
  harmonisateur: '', contactCorrecteur: '', contactHarmonisateur: '', absents: '',
  days: [emptyDay(), emptyDay(), emptyDay(), emptyDay()]
})
const pv = v => { const n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n }

export default function App() {
  const [view, setView] = useState('login')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('bepc_token'))
  const [subscription, setSubscription] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [activeDay, setActiveDay] = useState(0)
  const [activeSession, setActiveSession] = useState('matin')
  const [authForm, setAuthForm] = useState({ name: '', phone: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [payPhone, setPayPhone] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [payToken, setPayToken] = useState(null)
  const [payStep, setPayStep] = useState('form')

  useEffect(() => {
    if (token) {
      localStorage.setItem('bepc_token', token)
      checkSubscription().then(r => {
        setSubscription(r.data)
        setView('saisie')
      }).catch(() => setView('saisie'))
    }
  }, [token])

  const stats = useMemo(() => {
    const totals = Object.fromEntries(NOTES.map(n => [n, 0]))
    form.days.forEach(d => ['matin','soir'].forEach(s => NOTES.forEach(n => { totals[n] += pv(d[s][n]) })))
    const grandTotal = NOTES.reduce((a, n) => a + totals[n], 0)
    const sumNotes = NOTES.reduce((a, n) => a + n * totals[n], 0)
    const moyenne = grandTotal > 0 ? (sumNotes / grandTotal).toFixed(2) : '—'
    return { totals, grandTotal, moyenne }
  }, [form.days])

  const handleAuth = async (isRegister) => {
    setAuthLoading(true); setAuthError('')
    try {
      const fn = isRegister ? register : login
      const data = isRegister
        ? { name: authForm.name, phone: authForm.phone, password: authForm.password }
        : { phone: authForm.phone, password: authForm.password }
      const res = await fn(data)
      setToken(res.data.token)
      setUser(res.data.user)
    } catch (e) {
      setAuthError(e.response?.data?.error || 'Erreur de connexion')
    } finally { setAuthLoading(false) }
  }

  const handlePayment = async () => {
    setPayLoading(true); setPayError('')
    try {
      const res = await initiatePayment({ wavePhone: payPhone })
      setPayToken(res.data.token)
      setPayStep('waiting')
      const interval = setInterval(async () => {
        const status = await checkPaymentStatus(res.data.token)
        if (status.data.status === 'paid') {
          clearInterval(interval)
          setSubscription({ active: true, expiresAt: status.data.expiresAt })
          setPayStep('done')
        }
      }, 5000)
    } catch (e) {
      setPayError(e.response?.data?.error || 'Erreur paiement')
    } finally { setPayLoading(false) }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setNoteCount = (day, session, note, val) => {
    setForm(f => {
      const days = f.days.map((d, i) =>
        i === day ? { ...d, [session]: { ...d[session], [note]: val } } : d)
      return { ...f, days }
    })
  }

  const s = { bg: '#07111f', card: '#0d1e2e', border: '#1e3a5f', text: '#e2e8f0', muted: '#64748b', accent: '#0ea5e9', green: '#4ade80', yellow: '#f59e0b', red: '#f87171' }

  if (view === 'login' || view === 'register') {
    return (
      <div style={{ minHeight:'100vh', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'sans-serif' }}>
        <div style={{ background:s.card, borderRadius:20, padding:40, maxWidth:400, width:'100%', border:`1px solid ${s.border}` }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.accent }}>BEPC Stats 2026</div>
            <div style={{ fontSize:13, color:s.muted, marginTop:4 }}>Côte d'Ivoire — MEN-DECO</div>
          </div>
          {view === 'register' && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:s.muted, fontWeight:700, display:'block', marginBottom:5 }}>NOM COMPLET</label>
              <input value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: KOUASSI Jean" style={{ width:'100%', padding:'10px 12px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, color:s.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:s.muted, fontWeight:700, display:'block', marginBottom:5 }}>NUMÉRO DE TÉLÉPHONE</label>
            <input value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Ex: 0700000000" style={{ width:'100%', padding:'10px 12px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, color:s.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:s.muted, fontWeight:700, display:'block', marginBottom:5 }}>MOT DE PASSE</label>
            <input type="password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" style={{ width:'100%', padding:'10px 12px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, color:s.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          {authError && <div style={{ color:s.red, fontSize:12, marginBottom:12, textAlign:'center' }}>{authError}</div>}
          <button onClick={() => handleAuth(view === 'register')} disabled={authLoading}
            style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background: authLoading ? s.border : s.accent, color:'#fff', fontWeight:900, fontSize:15, cursor: authLoading ? 'not-allowed':'pointer', marginBottom:12 }}>
            {authLoading ? '⏳ Chargement...' : view === 'register' ? 'Créer mon compte' : 'Se connecter'}
          </button>
          <div style={{ textAlign:'center', fontSize:13, color:s.muted }}>
            {view === 'login' ? (
              <span>Pas de compte ? <span onClick={() => setView('register')} style={{ color:s.accent, cursor:'pointer', fontWeight:700 }}>Créer un compte</span></span>
            ) : (
              <span>Déjà un compte ? <span onClick={() => setView('login')} style={{ color:s.accent, cursor:'pointer', fontWeight:700 }}>Se connecter</span></span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:'sans-serif', minHeight:'100vh', background:s.bg, color:s.text }}>
      <header style={{ background:'#0d2137', borderBottom:`2px solid ${s.accent}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, color:s.muted, letterSpacing:3, textTransform:'uppercase' }}>Côte d'Ivoire • MEN-DECO</div>
          <div style={{ fontSize:18, fontWeight:900, color:s.accent }}>BEPC 2026 — Stats Notes</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => setView('saisie')} style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: view==='saisie' ? s.accent : '#0a1e30', color: view==='saisie' ? '#fff' : s.muted }}>✏️ Saisie</button>
          <button onClick={() => subscription?.active ? setView('fiche') : setPayModal(true)}
            style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: view==='fiche' ? s.green : '#0a1e30', color: view==='fiche' ? '#0f172a'
