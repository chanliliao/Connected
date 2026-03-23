import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import sunSvg from '../assets/sun.svg'
import calendarSvg from '../assets/calendar.svg'
import chairPlushSvg from '../assets/chairs/chair-plush.svg'
import tableBasicSvg from '../assets/tables/table-basic.svg'
import pictureFrameSvg from '../assets/picture_frame.svg'
import envelopeSvg from '../assets/envelope.svg'
import './HomePage.css'

const MOOD_COLORS = {
  sad:    { beam: 'rgba(80,130,200,',   fixture: '#5082c8' },
  angry:  { beam: 'rgba(190,20,20,',    fixture: '#be1414' },
  happy:  { beam: 'rgba(190,160,50,',   fixture: '#bea032' },
  horny:  { beam: 'rgba(170,70,130,',   fixture: '#aa4682' },
  relaxed: { beam: 'rgba(255,255,255,',  fixture: '#ffffff' },
  tired:   { beam: 'rgba(130,130,130,', fixture: '#828282' },
  hungry: { beam: 'rgba(190,100,40,',   fixture: '#be6428' },
  stress: { beam: 'rgba(130,75,200,',   fixture: '#824bc8' },
}

const MOODS = [
  { key: 'sad',    label: 'Sad',    color: '#5082c8' },
  { key: 'angry',  label: 'Angry',  color: '#be1414' },
  { key: 'happy',  label: 'Happy',  color: '#bea032' },
  { key: 'horny',  label: 'Horny',  color: '#aa4682' },
  { key: 'relaxed', label: 'Relaxed', color: '#ffffff' },
  { key: 'tired',   label: 'Tired',   color: '#828282' },
  { key: 'hungry', label: 'Hungry', color: '#be6428' },
  { key: 'stress', label: 'Stress', color: '#824bc8' },
]

function LightbulbSVG({ color }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" width="44" height="58" style={{ overflow: 'visible' }}>
      <ellipse cx="24" cy="22" rx="44" ry="44" fill={color} opacity="0.03"/>
      <ellipse cx="24" cy="22" rx="32" ry="32" fill={color} opacity="0.06"/>
      <ellipse cx="24" cy="22" rx="22" ry="22" fill={color} opacity="0.12"/>
      <circle cx="24" cy="22" r="17" fill={color}/>
      <path d="M14,34 Q14,44 18,44 L30,44 Q34,44 34,34 Z" fill={color} opacity="0.85"/>
      <rect x="17" y="44" width="14" height="5" rx="1" fill="rgba(251,113,133,0.3)"/>
      <rect x="18" y="49" width="12" height="4" rx="1" fill="rgba(251,113,133,0.2)"/>
    </svg>
  )
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function filterAndSort(list) {
  return list
    .filter(item => daysUntil(item.date) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function isMorning(tz) {
  if (!tz) return true
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
    10
  )
  return hour >= 6 && hour < 18
}

export default function HomePage({ session }) {
  const navigate = useNavigate()
  const appRef = useRef(null)
  const [moodModalOpen, setMoodModalOpen] = useState(false)
  const [userMood, setUserMood] = useState(() => localStorage.getItem('connected_user_mood') || 'relaxed')
  const [pendingMood, setPendingMood] = useState(() => localStorage.getItem('connected_user_mood') || 'relaxed')
  const [partnerMood, setPartnerMood] = useState(() => localStorage.getItem('connected_partner_mood') || 'relaxed')
  const [userTz, setUserTz] = useState(() => localStorage.getItem('connected_user_tz') || null)
  const [partnerTz, setPartnerTz] = useState(() => localStorage.getItem('connected_partner_tz') || null)
  const [countdownModalOpen, setCountdownModalOpen] = useState(false)
  const [countdowns, setCountdowns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('connected_countdowns') || '[]') } catch { return [] }
  })
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    const DESIGN_W = 430
    const DESIGN_H = 932
    const apply = () => {
      if (!appRef.current) return
      const scale = window.innerWidth / DESIGN_W
      appRef.current.style.transform = `scale(${scale})`
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  useEffect(() => {
    async function fetchTzs() {
      const { data } = await supabase
        .from('profiles')
        .select('user_tz, partner_tz, mood, partner_id, countdown_dates')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setUserTz(data.user_tz)
        setPartnerTz(data.partner_tz)
        localStorage.setItem('connected_user_tz', data.user_tz ?? '')
        localStorage.setItem('connected_partner_tz', data.partner_tz ?? '')
        if (data.mood) {
          setUserMood(data.mood)
          setPendingMood(data.mood)
          localStorage.setItem('connected_user_mood', data.mood)
        }
        if (data.countdown_dates) {
          const sorted = filterAndSort(data.countdown_dates)
          setCountdowns(sorted)
          localStorage.setItem('connected_countdowns', JSON.stringify(sorted))
        }
        if (data.partner_id) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('mood')
            .eq('id', data.partner_id)
            .single()
          if (pData?.mood) {
            setPartnerMood(pData.mood)
            localStorage.setItem('connected_partner_mood', pData.mood)
          }
        }
      }
    }
    fetchTzs()
  }, [session.user.id])

  const nextCountdown = countdowns[0] ?? null

  const userIsMorning = isMorning(userTz)
  const partnerIsMorning = isMorning(partnerTz)
  const userSkyClass = userIsMorning ? 'sky-morning-left' : 'sky-night-left'
  const partnerSkyClass = partnerIsMorning ? 'sky-morning-right' : 'sky-night-right'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function addCountdown() {
    if (!newLabel.trim() || !newDate) return
    const updated = filterAndSort([...countdowns, { label: newLabel.trim(), date: newDate }])
    setCountdowns(updated)
    localStorage.setItem('connected_countdowns', JSON.stringify(updated))
    setNewLabel('')
    setNewDate('')
    await supabase.rpc('save_countdown_dates', { dates: updated })
  }

  async function deleteCountdown(index) {
    const updated = countdowns.filter((_, i) => i !== index)
    setCountdowns(updated)
    localStorage.setItem('connected_countdowns', JSON.stringify(updated))
    await supabase.rpc('save_countdown_dates', { dates: updated })
  }

  return (
    <div className="home-page">
      <motion.div
        className="home-app"
        ref={appRef}
      >

        {/* Sky — full background */}
        <div className="home-sky">
          <div className={`home-sky-user ${userSkyClass}`} />
          <div className={`home-sky-partner ${partnerSkyClass}`} />
          {userIsMorning && (
            <img src={sunSvg} className="home-sun" alt="" aria-hidden="true" />
          )}
          {partnerIsMorning && (
            <img src={sunSvg} className="home-sun home-sun--right" alt="" aria-hidden="true" />
          )}
          {!userIsMorning && (
            <div className="home-moon home-moon--left" />
          )}
          {!partnerIsMorning && (
            <div className="home-moon" />
          )}
        </div>

        {/* House — bottom 75% */}
        <div className="home-house-wrap">
          {/* Roof SVG: fills triangle with house color + draws pink outline stroke */}
          <svg
            className="home-roof-svg"
            viewBox="0 0 430 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="0,100 215,0 430,100" fill="#160412" />
            <polyline
              points="0,100 215,0 430,100"
              fill="none"
              stroke="#fb7185"
              strokeWidth="2.5"
            />
          </svg>

          {/* Walls */}
          <div className="home-house-walls">
            {/* Ceiling lights — left = user, right = SO */}
            <div className="home-lights">
              <div className="home-light home-light-left home-light--on">
                <button
                  className="home-light-fixture"
                  onClick={() => { setPendingMood(userMood); setMoodModalOpen(true) }}
                  aria-label="Open mood light"
                  style={{
                    background: MOOD_COLORS[userMood].fixture,
                    boxShadow: `0 0 10px ${MOOD_COLORS[userMood].fixture}, 0 2px 4px rgba(0,0,0,0.6)`,
                  }}
                />
                <div
                  className="home-light-beam"
                  style={{
                    background: `linear-gradient(180deg, ${MOOD_COLORS[userMood].beam}0.35) 0%, ${MOOD_COLORS[userMood].beam}0.12) 55%, transparent 100%)`,
                  }}
                />
              </div>

              <div
                className="home-light home-light-right home-light--on"
              >
                <div
                  className="home-light-fixture"
                  style={{
                    background: MOOD_COLORS[partnerMood].fixture,
                    boxShadow: `0 0 10px ${MOOD_COLORS[partnerMood].fixture}, 0 2px 4px rgba(0,0,0,0.6)`,
                  }}
                />
                <div
                  className="home-light-beam"
                  style={{
                    background: `linear-gradient(180deg, ${MOOD_COLORS[partnerMood].beam}0.35) 0%, ${MOOD_COLORS[partnerMood].beam}0.12) 55%, transparent 100%)`,
                  }}
                />
              </div>
            </div>

            <button
              className="home-calendar-btn"
              onClick={() => setCountdownModalOpen(true)}
              aria-label="Open countdown list"
            >
              <img src={calendarSvg} alt="" aria-hidden="true" className="home-calendar-img" />
              {nextCountdown && (
                <div className="home-calendar-overlay">
                  <span className="home-calendar-event-label">{nextCountdown.label.slice(0, 6)}</span>
                  <span className="home-calendar-days-text">days left</span>
                  <span className="home-calendar-days-num">{daysUntil(nextCountdown.date)}</span>
                </div>
              )}
            </button>

            <div className="home-house-interior">
              <div className="home-house-left" />
              <div className="home-house-right" />
            </div>

            {/* ── Right-side shelves ── */}
            <div className="home-shelf home-shelf--right-top" />
            <div className="home-shelf home-shelf--right-mid" />

            {/* ── Left bookshelf — empty ── */}
            <div className="home-bookshelf">
              <button className="home-photo-frame-btn" onClick={() => navigate('/our-photos')} aria-label="Our Photos">
                <img src={pictureFrameSvg} alt="Our Photos" />
              </button>
              <div className="home-bookshelf-shelf" />
              <div className="home-bookshelf-shelf" />
              <div className="home-bookshelf-shelf" />
            </div>

            {/* Plush armchair — in front of left bookshelf */}
            <img src={chairPlushSvg} className="home-chair-plush" alt="" aria-hidden="true" />

            {/* Basic table — right room, centered, at floor level */}
            <div className="home-table-wrapper">
              <button className="home-envelope-btn" onClick={() => navigate('/notes')} aria-label="Notes">
                <img src={envelopeSvg} alt="Notes" />
              </button>
              <img src={tableBasicSvg} className="home-table-img" alt="" aria-hidden="true" />
            </div>
          </div>

          {/* Floor band — visible divide from walls above */}
          <div className="home-floor" />

          {/* Curved SVG arch — separates floor from nav (no line, just shape) */}
          <svg className="home-nav-curve" viewBox="0 0 430 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,24 Q215,0 430,24 L430,24 L0,24 Z" fill="#3d1a30"/>
          </svg>

          {/* Carpet / floor strip where nav lives */}
          <div className="home-carpet" />
        </div>

        {/* Bottom-right nav */}
        <nav className="home-bottom-nav">
          <button className="home-nav-btn" aria-label="Customize">
            {/* Wrench — solid fill */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
          </button>

          <button
            className="home-nav-btn"
            aria-label="Profile"
            onClick={() => navigate('/profile')}
          >
            {/* Person — solid fill */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7H4z" />
            </svg>
          </button>
        </nav>

        {/* Countdown Modal */}
        <AnimatePresence>
          {countdownModalOpen && (
            <>
              <motion.div
                className="home-mood-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCountdownModalOpen(false)}
              />
              <motion.div
                className="home-mood-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => { if (info.offset.y > 80) setCountdownModalOpen(false) }}
              >
                <div className="home-mood-handle" />
                <h2 className="home-mood-title">Countdown List</h2>

                <div className="home-countdown-list">
                  {countdowns.length === 0 && (
                    <p className="home-countdown-empty">No countdowns yet.</p>
                  )}
                  {countdowns.map((item, i) => (
                    <div key={i} className="home-countdown-row">
                      <div className="home-countdown-info">
                        <span className="home-countdown-row-label">{item.label}</span>
                        <span className="home-countdown-row-days">{daysUntil(item.date)} days left</span>
                      </div>
                      <button className="profile-date-delete-btn" onClick={() => deleteCountdown(i)} aria-label="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="home-countdown-add-row">
                  <input
                    className="profile-date-label-input"
                    placeholder="Label"
                    maxLength={6}
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                  />
                  <input
                    className="profile-date-input"
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <button className="home-mood-save" onClick={addCountdown}>Add Countdown</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mood Light Modal */}
        <AnimatePresence>
          {moodModalOpen && (
            <>
              <motion.div
                className="home-mood-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoodModalOpen(false)}
              />
              <motion.div
                className="home-mood-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => { if (info.offset.y > 80) setMoodModalOpen(false) }}
              >
                <div className="home-mood-handle" />
                <h2 className="home-mood-title">Mood Light</h2>
                <div className="home-mood-grid">
                  {MOODS.map(mood => (
                    <button
                      key={mood.key}
                      className={`home-mood-bulb${pendingMood === mood.key ? ' home-mood-bulb--selected' : ''}`}
                      onClick={() => setPendingMood(mood.key)}
                      style={pendingMood === mood.key ? {
                        boxShadow: `0 0 14px ${mood.color}44`,
                        borderColor: `${mood.color}88`,
                        background: `radial-gradient(ellipse at 50% 38%, ${mood.color}22 0%, ${mood.color}0a 55%, transparent 80%)`,
                      } : {
                        background: `radial-gradient(ellipse at 50% 38%, ${mood.color}10 0%, ${mood.color}05 50%, transparent 78%)`,
                      }}
                    >
                      <LightbulbSVG color={mood.color} />
                      <span className="home-mood-label">{mood.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="home-mood-save"
                  onClick={async () => {
                    setUserMood(pendingMood)
                    localStorage.setItem('connected_user_mood', pendingMood)
                    setMoodModalOpen(false)
                    await supabase.from('profiles').update({ mood: pendingMood }).eq('id', session.user.id)
                  }}
                >
                  Set Mood
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
