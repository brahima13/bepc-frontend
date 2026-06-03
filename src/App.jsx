import { useState, useEffect, useMemo } from 'react'
import { register, login, checkSubscription } from './api.js'

const NOTES = Array.from({ length: 21 }, (_, i) => i)
const DAY_LABELS = ['1er jour', '2ème jour', '3ème jour', '4ème jour']
const emptyDay = () => ({
  matin: Object.fromEntries(NOTES.map(n => [n, ''])),
  soir: Object.fromEntries(NOTES.map(n => [n, '']))
})
const emptyForm = () => ({
  discipline: '', ccd: '', drena: '', correcteur: '',
  harmonisateur: '', contactCorrecteur: '', contactHarmonisateur: '', absents: '',
  days: [emptyDay(), emptyDay(), emptyDay(), emptyDay()]
})
const pv = v => { const n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n }

export default function App() {
  const [view, setView] = useState('login')
  const [token, setToken] = useState(localStorage.getItem('bepc_token'))
  const [form, setForm] = useState(emptyForm())
  const [activeDay, setActiveDay] = useState(0)
  const [activeSession, setActiveSession] = useState('matin')
  const [authForm, setAuthForm] = useState({ name: '', phone: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (token) {
      localStorage.setItem('bepc_token', token)
      setView('saisie')
    }
  }, [token])

  const stats = useMemo(() => {
    const totals = Object.fromEntries(NOTES.map(n => [n, 0]))
    form.days.forEach(d =>
      ['matin','soir'].forEach(s =>
        NOTES.forEach(n => { totals[n] += pv(d[s][n]) })
      )
    )
    const grandTotal = NOTES.reduce((a, n) => a + totals[n], 0)
    const sumNotes = NOTES.reduce((a, n) => a + n * totals[n], 0)
    const moyenne = grandTotal > 0 ? (sumNotes / grandTotal).toFixed(2) : '0.00'
    return { totals, grandTotal, moyenne }
  }, [form.days])

  const handleAuth = async (isRegister) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const fn = isRegister ? register : login
      const data = isRegister
        ? { name: authForm.name, phone: authForm.phone, password: authForm.password }
        : { phone: authForm.phone, password: authForm.password }
      const res = await fn(data)
      setToken(res.data.token)
    } catch (e) {
      setAuthError(e.response?.data?.error || 'Erreur de connexion')
    } finally {
      setAuthLoading(false)
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setNoteCount = (day, session, note, val) => {
    setForm(f => {
      const days = f.days.map((d, i) =>
        i === day ? { ...d, [session]: { ...d[session], [note]: val } } : d
      )
      return { ...f, days }
    })
  }

  const C = {
    bg: '#07111f', card: '#0d1e2e', border: '#1e3a5f',
    text: '#e2e8f0', muted: '#64748b', accent: '#0ea5e9',
    green: '#4ade80', yellow: '#f59e0b', red: '#f87171'
  }

  const inp = {
    width: '100%', padding: '9px 12px', background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box'
  }

  if (view === 'login' || view === 'register') {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'sans-serif' }}>
        <div style={{ background:C.card, borderRadius:20, padding:40, maxWidth:400, width:'100%', border:`1px solid ${C.border}` }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.accent }}>BEPC Stats 2026</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>Côte d'Ivoire — MEN-DECO</div>
          </div>
          {view === 'register' && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:C.muted, fontWeight:700, display:'block', marginBottom:5 }}>NOM COMPLET</label>
              <input value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: KOUASSI Jean" style={inp} />
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:700, display:'block', marginBottom:5 }}>NUMÉRO DE TÉLÉPHONE</label>
            <input value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} placeholder="Ex: 0700000000" style={inp} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:700, display:'block', marginBottom:5 }}>MOT DE PASSE</label>
            <input type="password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={inp} />
          </div>
          {authError && <div style={{ color:C.red, fontSize:12, marginBottom:12, textAlign:'center' }}>{authError}</div>}
          <button onClick={() => handleAuth(view === 'register')} disabled={authLoading}
            style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background: authLoading ? C.border : C.accent, color:'#fff', fontWeight:900, fontSize:15, cursor: authLoading ? 'not-allowed':'pointer', marginBottom:12 }}>
            {authLoading ? '⏳ Chargement...' : view === 'register' ? 'Créer mon compte' : 'Se connecter'}
          </button>
          <div style={{ textAlign:'center', fontSize:13, color:C.muted }}>
            {view === 'login'
              ? <span>Pas de compte ? <span onClick={() => setView('register')} style={{ color:C.accent, cursor:'pointer', fontWeight:700 }}>Créer un compte</span></span>
              : <span>Déjà un compte ? <span onClick={() => setView('login')} style={{ color:C.accent, cursor:'pointer', fontWeight:700 }}>Se connecter</span></span>
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:'sans-serif', minHeight:'100vh', background:C.bg, color:C.text }}>
      <header style={{ background:'#0d2137', borderBottom:`2px solid ${C.accent}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:'uppercase' }}>Côte d'Ivoire • MEN-DECO</div>
          <div style={{ fontSize:18, fontWeight:900, color:C.accent }}>BEPC 2026 — Stats Notes</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => document.getElementById('scanGalerie').click()}
  style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background:'#8b5cf6', color:'#fff' }}>
  🖼️ Galerie
</button>
<button onClick={() => document.getElementById('scanCamera').click()}
  style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background:'#6d28d9', color:'#fff' }}>
  📷 Caméra
</button>
<input id="scanGalerie" type="file" accept="image/*" style={{ display:'none' }}
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (!file) return
    alert('Photo importée ! Fonction extraction IA disponible prochainement.')
  }}
/>
<input id="scanCamera" type="file" accept="image/*" capture="environment" style={{ display:'none' }}
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (!file) return
    alert('Photo prise ! Fonction extraction IA disponible prochainement.')
  }}
/>
          />
          <button onClick={() => setView('saisie')}
            style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: view==='saisie' ? C.accent : '#0a1e30', color: view==='saisie' ? '#fff' : C.muted }}>
            ✏️ Saisie
          </button>
          <button onClick={() => setView('fiche')}
            style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: view==='fiche' ? C.green : '#0a1e30', color: view==='fiche' ? '#0f172a' : C.muted }}>
            📊 Fiche Statistique
          </button>
          <button onClick={() => { localStorage.removeItem('bepc_token'); setToken(null); setView('login') }}
            style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.red}`, cursor:'pointer', fontWeight:700, fontSize:12, background:'transparent', color:C.red }}>
            Déconnexion
          </button>
          <button onClick={async () => {
            if (window.deferredPrompt) {
              window.deferredPrompt.prompt()
              await window.deferredPrompt.userChoice
              window.deferredPrompt = null
            } else {
              alert('Pour installer : Menu du navigateur puis Ajouter à l\'écran d\'accueil')
            }
          }}
            style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.accent}`, cursor:'pointer', fontWeight:700, fontSize:12, background:'transparent', color:C.accent }}>
            📲 Installer
          </button>
        </div>
      </header>

      {view === 'saisie' && (
        <div style={{ maxWidth:940, margin:'0 auto', padding:'24px 14px' }}>
          <div style={{ background:C.card, borderRadius:14, padding:22, marginBottom:18, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:C.accent, fontWeight:800, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>📋 Informations Générales</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[['discipline','Discipline'],['ccd','C.C.D'],['drena','DRENA du CCD'],['absents','Candidats absents'],
                ['correcteur','Nom du correcteur'],['harmonisateur','Nom harmonisateur'],
                ['contactCorrecteur','Contact correcteur'],['contactHarmonisateur','Contact harmonisateur']
              ].map(([k,l]) => (
                <div key={k}>
                  <label style={{ fontSize:10, color:C.muted, fontWeight:700, display:'block', marginBottom:5, textTransform:'uppercase' }}>{l}</label>
                  <input value={form[k]} onChange={e => setField(k, e.target.value)} style={inp} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:C.card, borderRadius:14, padding:22, marginBottom:18, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:'#8b5cf6', fontWeight:800, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>📅 Saisie par Jour et Session</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {DAY_LABELS.map((l, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: activeDay===i ? C.accent : '#0a1e30', color: activeDay===i ? '#fff' : C.muted }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:18 }}>
              {['matin','soir'].map(ss => (
                <button key={ss} onClick={() => setActiveSession(ss)}
                  style={{ padding:'7px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: activeSession===ss ? C.yellow : '#0a1e30', color: activeSession===ss ? '#0f172a' : C.muted }}>
                  {ss === 'matin' ? '🌅 Matin' : '🌆 Soir'}
                </button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
              {NOTES.map(note => {
                const val = form.days[activeDay][activeSession][note]
                const ac = note < 10 ? C.red : note < 12 ? C.yellow : C.green
                return (
                  <div key={note} style={{ background:C.bg, borderRadius:10, padding:'10px 12px', border:`1px solid ${pv(val) > 0 ? ac+'66' : C.border}` }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5 }}>
                      Note : <span style={{ color:ac, fontSize:14, fontWeight:900 }}>{note}</span>/20
                    </div>
                    <input type="number" min="0" value={val}
                      onChange={e => setNoteCount(activeDay, activeSession, note, e.target.value)}
                      placeholder="0"
                      style={{ width:'100%', padding:'6px 8px', background:C.card, border:`1px solid ${C.border}`, borderRadius:6, color:ac, fontSize:16, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' }} />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[['Total copies', stats.grandTotal, C.accent],['Absents', pv(form.absents), C.yellow],['Moyenne', `${stats.moyenne}/20`, C.green]].map(([l,v,c]) => (
              <div key={l} style={{ background:C.card, borderRadius:12, padding:'16px 18px', border:`1px solid ${c}33` }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:24, fontWeight:900, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'fiche' && (
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'20px 14px' }}>
          <div style={{ textAlign:'right', marginBottom:14 }}>
            <button onClick={() => window.print()}
              style={{ padding:'10px 24px', borderRadius:10, border:'none', background:C.accent, color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>
              🖨️ Imprimer / PDF
            </button>
          </div>
          <div style={{ background:'#fff', color:'#000', borderRadius:10, padding:28, fontFamily:'Arial,sans-serif', fontSize:11 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:9, lineHeight:1.7 }}>
                MINISTÈRE DE L'ÉDUCATION NATIONALE<br/>
                DE L'ALPHABÉTISATION<br/>
                ET DE L'ENSEIGNEMENT TECHNIQUE<br/>
                <br/>DIRECTION DES EXAMENS ET CONCOURS
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ border:'2px solid #000', padding:'8px 20px' }}>
                  <div style={{ fontWeight:900, fontSize:14 }}>BEPC/T.0 – SESSION 2026</div>
                  <div style={{ fontWeight:900, fontSize:12, marginTop:4 }}>FICHE STATISTIQUES DE DISTRIBUTION</div>
                  <div style={{ fontWeight:900, fontSize:12 }}>DES NOTES DES ÉPREUVES ÉCRITES</div>
                </div>
              </div>
              <div style={{ fontSize:9, textAlign:'right', lineHeight:1.7 }}>
                RÉPUBLIQUE DE CÔTE D'IVOIRE<br/>Union – Discipline – Travail
                <div style={{ border:'2px solid #000', padding:'4px 10px', fontWeight:900, fontSize:12, marginTop:6, textAlign:'center' }}>DOCUMENT C-4</div>
              </div>
            </div>
            <div style={{ lineHeight:2, borderBottom:'1px solid #ccc', paddingBottom:8, marginBottom:10 }}>
              <div><strong>Discipline :</strong> <u>{form.discipline}</u></div>
              <div style={{ display:'flex', gap:32 }}>
                <div><strong>C.C.D :</strong> <u>{form.ccd}</u></div>
                <div><strong>DRENA DU CCD :</strong> <u>{form.drena}</u></div>
              </div>
              <div style={{ display:'flex', gap:32 }}>
                <div><strong>Correcteur :</strong> <u>{form.correcteur}</u></div>
                <div><strong>Harmonisateur :</strong> <u>{form.harmonisateur}</u></div>
              </div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
              <thead>
                <tr>
                  <th style={{ border:'1px solid #000', padding:'3px 6px', background:'#e2e8f0' }}>Notes</th>
                  {DAY_LABELS.map((d,i) => (
                    <th key={i} colSpan={2} style={{ border:'1px solid #000', padding:'3px 6px', background:'#e2e8f0', textAlign:'center' }}>{d}</th>
                  ))}
                  <th style={{ border:'1px solid #000', padding:'3px 6px', background:'#e2e8f0' }}>Total</th>
                </tr>
                <tr>
                  <th style={{ border:'1px solid #000', padding:'2px 4px', background:'#f8fafc' }}></th>
                  {DAY_LABELS.map((_,i) => (
                    ['Matin','Soir'].map(ss => (
                      <th key={`${i}${ss}`} style={{ border:'1px solid #000', padding:'2px 4px', background:'#f8fafc', fontSize:9 }}>{ss}</th>
                    ))
                  ))}
                  <th style={{ border:'1px solid #000', padding:'2px 4px', background:'#f8fafc' }}></th>
                </tr>
              </thead>
              <tbody>
                {NOTES.map(note => {
                  const bg = note < 10 ? '#fff5f5' : note < 12 ? '#fffbeb' : '#f0fdf4'
                  const hd = note < 10 ? '#fecaca' : note < 12 ? '#fde68a' : '#bbf7d0'
                  return (
                    <tr key={note} style={{ background:bg }}>
                      <td style={{ border:'1px solid #000', padding:'2px 6px', fontWeight:900, textAlign:'center', background:hd }}>{note}</td>
                      {[0,1,2,3].map(di => (
                        ['matin','soir'].map(ss => (
                          <td key={`${di}${ss}`} style={{ border:'1px solid #000', padding:'2px 5px', textAlign:'center' }}>
                            {pv(form.days[di][ss][note]) || ''}
                          </td>
                        ))
                      ))}
                      <td style={{ border:'1px solid #000', padding:'2px 6px', textAlign:'center', fontWeight:900, background:'#dbeafe' }}>
                        {stats.totals[note] || ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap', fontSize:11 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                <strong>Total copies corrigées</strong>
                <div style={{ border:'2px solid #000', padding:'5px 16px', fontWeight:900 }}>{stats.grandTotal}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                <strong>Candidats absents</strong>
                <div style={{ border:'2px solid #000', padding:'5px 16px', fontWeight:900 }}>{pv(form.absents)}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                <strong>Moyenne générale</strong>
                <div style={{ border:'2px solid #000', padding:'5px 16px', fontWeight:900 }}>{stats.moyenne}/20</div>
              </div>
            </div>
            <div style={{ marginTop:20, display:'flex', justifyContent:'space-between', fontSize:10 }}>
              <div>Fait à _________________________, le ___/___/2026</div>
              <div>(Nom, prénoms, contacts et signature du correcteur.)</div>
            </div>
            <div style={{ marginTop:10, fontSize:8, color:'#9ca3af', textAlign:'center', borderTop:'1px solid #e5e7eb', paddingTop:8 }}>
              BP V 276 ABIDJAN ** Tél : 27 20 32 00 74 ** Site web : www.men-deco.org
            </div>
          </div>
        </div>
      )}
      <style>{`@media print { header, button { display:none!important; } body { background:#fff!important; } }`}</style>
    </div>
  )
}
