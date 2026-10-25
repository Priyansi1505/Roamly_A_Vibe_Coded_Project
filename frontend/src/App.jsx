import { useMemo, useState } from 'react'
import { Compass, MapPin, CalendarDays, Wallet, Sparkles, Clock3, Car, Utensils, Camera, Heart, Download, RefreshCw, CheckCircle2, Plane, Menu, Plus, ArrowUpRight, SlidersHorizontal } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const today = new Date()
const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
const afterTomorrow = new Date(today); afterTomorrow.setDate(today.getDate()+3)

const initialForm = {
  destination: 'Jaipur, Rajasthan',
  start_date: dateStr(tomorrow),
  end_date: dateStr(afterTomorrow),
  budget: 8000,
  currency: 'INR',
  travel_style: 'balanced',
  pace: 'moderate',
  group_size: 1,
  interests: ['sightseeing', 'local food', 'culture'],
  notes: ''
}
const interestOptions = ['sightseeing', 'local food', 'culture', 'nature', 'shopping', 'adventure', 'photography', 'nightlife']

function App() {
  const [form, setForm] = useState(initialForm)
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState(0)
  const [saved, setSaved] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const toggleInterest = (interest) => update('interests', form.interests.includes(interest) ? form.interests.filter(x => x !== interest) : [...form.interests, interest])
  const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(n || 0)
  const activityCount = useMemo(() => trip?.days?.reduce((sum, day) => sum + day.activities.length, 0) || 0, [trip])

  async function generate(e) {
    e?.preventDefault()
    setLoading(true); setError(''); setSaved(false)
    try {
      const response = await fetch(`${API}/api/trips/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, budget: Number(form.budget), group_size: Number(form.group_size) })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Could not generate itinerary. Is the backend running?')
      }
      const data = await response.json()
      setTrip(data); setActiveDay(0)
    } catch (err) {
      setError(`${err.message}. Start the FastAPI backend, then try again.`)
    } finally { setLoading(false) }
  }

  function exportTrip() {
    if (!trip) return
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `${trip.destination.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-itinerary.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function editActivity(dayIndex, activityIndex, field, value) {
    setTrip(prev => ({ ...prev, days: prev.days.map((d, di) => di !== dayIndex ? d : ({ ...d, activities: d.activities.map((a, ai) => ai !== activityIndex ? a : ({ ...a, [field]: field === 'estimated_cost' ? Number(value) : value })) })), total_estimated_cost: prev.days.reduce((sum, d, di) => sum + d.activities.reduce((s, a, ai) => s + (di === dayIndex && ai === activityIndex ? Number(field === 'estimated_cost' ? value : a.estimated_cost) : a.estimated_cost), 0), 0) }))
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'show' : ''}`}>
      <div className="brand"><div className="brand-icon"><Compass size={22}/></div><div><b>roamly</b><span>YOUR TRIP, REIMAGINED</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><SlidersHorizontal size={17}/> Trip planner</button>
      <button className="nav-item" onClick={() => trip && exportTrip()}><CalendarDays size={17}/> My itineraries</button>
      <button className="nav-item" onClick={() => document.getElementById('preferences')?.scrollIntoView({behavior:'smooth'})}><Heart size={17}/> Preferences</button>
      <div className="side-card"><div className="side-card-icon"><Sparkles size={18}/></div><b>Your next adventure</b><p>Great trips start with a little curiosity.</p><button onClick={() => document.getElementById('planner')?.scrollIntoView({behavior:'smooth'})}>Plan a trip <ArrowUpRight size={14}/></button></div>
      <div className="sidebar-bottom"><div className="avatar">T</div><div><b>Travel explorer</b><span>Personal workspace</span></div><span className="online-dot"/></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button>
        <div className="crumb">Workspace <span>/</span> <b>Trip planner</b></div>
        <div className="top-actions"><span className="status-dot"/> <span>AI trip assistant</span><div className="top-avatar">T</div></div>
      </header>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL TRAVEL ASSISTANT</div><h1>Somewhere wonderful<br/>is <em>waiting for you.</em></h1><p>Tell us what you love. We'll turn your travel ideas into a thoughtful, day-by-day plan.</p><div className="hero-points"><span><CheckCircle2 size={15}/> Made for you</span><span><CheckCircle2 size={15}/> Budget-aware</span><span><CheckCircle2 size={15}/> Flexible plans</span></div></div>
        <div className="hero-art"><div className="sun"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="hero-stamp"><Plane size={20}/><span>GO<br/>EXPLORE</span></div><div className="art-caption"><MapPin size={14}/> Your next chapter starts here</div></div>
      </section>

      <div className="content-grid">
        <section className="planner-card" id="planner">
          <div className="section-head"><div><div className="step-label">STEP 01 <span>•</span> THE BASICS</div><h2>Build your trip</h2><p>A few details help us make it feel like your trip.</p></div><div className="head-icon"><MapPin size={20}/></div></div>
          <form onSubmit={generate}>
            <label className="field-label">Where do you want to go?</label>
            <div className="input-wrap"><MapPin size={17}/><input value={form.destination} onChange={e=>update('destination',e.target.value)} placeholder="City, country or region" required minLength={2}/></div>
            <div className="two-col">
              <div><label className="field-label">Departure</label><div className="input-wrap"><CalendarDays size={16}/><input type="date" value={form.start_date} onChange={e=>update('start_date',e.target.value)} required/></div></div>
              <div><label className="field-label">Return</label><div className="input-wrap"><CalendarDays size={16}/><input type="date" value={form.end_date} min={form.start_date} onChange={e=>update('end_date',e.target.value)} required/></div></div>
            </div>
            <div className="two-col">
              <div><label className="field-label">Total budget</label><div className="input-wrap"><Wallet size={16}/><span className="currency-prefix">₹</span><input type="number" min="1" value={form.budget} onChange={e=>update('budget',e.target.value)} required/></div></div>
              <div><label className="field-label">Who's travelling?</label><div className="input-wrap"><span className="people-icon">♙</span><select value={form.group_size} onChange={e=>update('group_size',e.target.value)}>{[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n=><option key={n} value={n}>{n} {n===1?'traveller':'travellers'}</option>)}</select></div></div>
            </div>
            <div className="divider-line"/>
            <div id="preferences" className="section-head compact"><div><div className="step-label">STEP 02 <span>•</span> YOUR VIBE</div><h2>Make it yours</h2></div><div className="head-icon soft"><Heart size={19}/></div></div>
            <label className="field-label">Travel style</label>
            <div className="choice-grid">{[['budget','🎒','Budget-friendly'],['balanced','🌿','Balanced'],['premium','✨','Premium']].map(([value,emoji,label])=><button type="button" key={value} className={`choice ${form.travel_style===value?'selected':''}`} onClick={()=>update('travel_style',value)}><span>{emoji}</span><b>{label}</b></button>)}</div>
            <label className="field-label">What are you into?</label>
            <div className="chips">{interestOptions.map(i=><button type="button" key={i} className={`chip ${form.interests.includes(i)?'picked':''}`} onClick={()=>toggleInterest(i)}>{form.interests.includes(i)&&<CheckCircle2 size={13}/>} {i}</button>)}</div>
            <div className="two-col last-fields"><div><label className="field-label">Daily pace</label><select className="plain-select" value={form.pace} onChange={e=>update('pace',e.target.value)}><option value="relaxed">Relaxed</option><option value="moderate">Moderate</option><option value="packed">See it all</option></select></div><div><label className="field-label">Anything else? <span className="optional">Optional</span></label><input className="plain-input" value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="e.g. vegetarian, no early starts"/></div></div>
            {error&&<div className="error-box">{error}</div>}
            <button className="generate-btn" type="submit" disabled={loading}>{loading?<><RefreshCw size={17} className="spin"/> Creating your itinerary…</>:<><Sparkles size={17}/> Generate my itinerary <span>↗</span></>}</button>
            <div className="privacy-note">✦ No bookings, no pressure — just a plan to get you started.</div>
          </form>
        </section>

        <section className="results-column">
          {!trip ? <div className="empty-card"><div className="empty-illustration"><div className="empty-sun"/><div className="empty-mountain one"/><div className="empty-mountain two"/><div className="empty-path"/></div><div className="step-label">YOUR CANVAS AWAITS</div><h2>Your next adventure,<br/><em>beautifully planned.</em></h2><p>Fill in your trip details and we'll put together a personalized itinerary with ideas for every day.</p><div className="empty-features"><div><span className="feature-icon peach"><Clock3 size={17}/></span><div><b>Less planning</b><small>Spend less time researching</small></div></div><div><span className="feature-icon green"><Wallet size={17}/></span><div><b>Budget in mind</b><small>Keep costs in perspective</small></div></div><div><span className="feature-icon lavender"><Heart size={17}/></span><div><b>Your kind of trip</b><small>Built around your interests</small></div></div></div></div>
          : <div className="itinerary-card">
            <div className="itinerary-top"><div><div className="step-label"><span className="live-dot"/> YOUR ITINERARY IS READY</div><h2>{trip.destination}</h2><p>{trip.summary}</p></div><button className="icon-button" onClick={exportTrip} title="Export JSON"><Download size={17}/></button></div>
            <div className="stats-row"><div><span>EST. ACTIVITIES</span><b>{activityCount}</b></div><div><span>EST. TOTAL</span><b>{money(trip.total_estimated_cost)}</b></div><div><span>TRIP LENGTH</span><b>{trip.days.length} days</b></div></div>
            <div className="day-tabs">{trip.days.map((d,i)=><button key={d.date} onClick={()=>setActiveDay(i)} className={activeDay===i?'day-tab active':'day-tab'}><span>DAY {d.day}</span><b>{new Date(d.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</b></button>)}</div>
            {trip.days[activeDay]&&<div className="day-content"><div className="day-title"><div><span>DAY {trip.days[activeDay].day}</span><h3>{trip.days[activeDay].theme}</h3></div><span className="day-date">{new Date(trip.days[activeDay].date+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span></div>
              <div className="activity-list">{trip.days[activeDay].activities.map((a,i)=><div className="activity" key={`${activeDay}-${i}`}><div className="activity-time">{a.time}</div><div className="timeline"><div className="timeline-dot">{a.category.toLowerCase().includes('food')?<Utensils size={13}/>:a.category.toLowerCase().includes('nature')?<Heart size={13}/>:a.category.toLowerCase().includes('culture')?<Camera size={13}/>:<MapPin size={13}/>}</div>{i<trip.days[activeDay].activities.length-1&&<div className="timeline-line"/>}</div><div className="activity-body"><input aria-label="Activity title" value={a.title} onChange={e=>editActivity(activeDay,i,'title',e.target.value)} className="activity-title-input"/><p>{a.description}</p><div className="activity-meta"><span><Car size={12}/> {a.transport}</span><span><Wallet size={12}/> <input aria-label="Estimated cost" type="number" value={a.estimated_cost} onChange={e=>editActivity(activeDay,i,'estimated_cost',e.target.value)}/> {form.currency}</span></div></div></div>)}</div>
            </div>}
            <div className="results-footer"><span><Sparkles size={14}/> Generated with {trip.source==='gemini'?'Gemini AI':'demo mode'}</span><button onClick={generate} disabled={loading}><RefreshCw size={14}/> Regenerate</button></div>
            <div className="estimate-note">Costs are planning estimates, not live prices or bookings. Edit activity names and estimates to personalize your plan.</div>
          </div>}
          <div className="tip-card"><div className="tip-icon"><Sparkles size={17}/></div><div><b>A little travel wisdom</b><p>Leave breathing room between activities. The best travel moments are sometimes the ones you didn't plan.</p></div><span className="tip-spark">✳</span></div>
        </section>
      </div>
      <footer className="footer"><span>© 2026 Roamly · Personal travel planning, made thoughtful.</span><span>Built for curious people <Heart size={12} fill="currentColor"/></span></footer>
    </main>
  </div>
}
export default App
