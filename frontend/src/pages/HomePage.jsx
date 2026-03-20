import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import sunSvg from '../assets/sun.svg'
import chairPlushSvg from '../assets/chairs/chair-plush.svg'
import tableBasicSvg from '../assets/tables/table-basic.svg'
import './HomePage.css'

const MOOD_COLORS = {
  sad:    { beam: 'rgba(80,130,200,',   fixture: '#5082c8' },
  angry:  { beam: 'rgba(190,20,20,',    fixture: '#be1414' },
  happy:  { beam: 'rgba(190,160,50,',   fixture: '#bea032' },
  horny:  { beam: 'rgba(170,70,130,',   fixture: '#aa4682' },
  peace:  { beam: 'rgba(255,255,255,',  fixture: '#ffffff' },
  tired:  { beam: 'rgba(90,110,140,',   fixture: '#5a6e8c' },
  hungry: { beam: 'rgba(190,100,40,',   fixture: '#be6428' },
  stress: { beam: 'rgba(130,75,200,',   fixture: '#824bc8' },
}

const MOODS = [
  { key: 'sad',    label: 'Sad',    color: '#5082c8' },
  { key: 'angry',  label: 'Angry',  color: '#be1414' },
  { key: 'happy',  label: 'Happy',  color: '#bea032' },
  { key: 'horny',  label: 'Horny',  color: '#aa4682' },
  { key: 'peace',  label: 'Peace',  color: '#ffffff' },
  { key: 'tired',  label: 'Tired',  color: '#5a6e8c' },
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
  const [soLightOn, setSoLightOn] = useState(true)
  const [moodModalOpen, setMoodModalOpen] = useState(false)
  const [userMood, setUserMood] = useState('peace')
  const [pendingMood, setPendingMood] = useState('peace')
  const [userTz, setUserTz] = useState(() => localStorage.getItem('connected_user_tz') || null)
  const [partnerTz, setPartnerTz] = useState(() => localStorage.getItem('connected_partner_tz') || null)

  useEffect(() => {
    const DESIGN_W = 430
    const DESIGN_H = 932
    const apply = () => {
      if (!appRef.current) return
      const scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
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
        .select('user_tz, partner_tz')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setUserTz(data.user_tz)
        setPartnerTz(data.partner_tz)
        localStorage.setItem('connected_user_tz', data.user_tz ?? '')
        localStorage.setItem('connected_partner_tz', data.partner_tz ?? '')
      }
    }
    fetchTzs()
  }, [session.user.id])

  const userIsMorning = isMorning(userTz)
  const partnerIsMorning = isMorning(partnerTz)
  const userSkyClass = userIsMorning ? 'sky-morning-left' : 'sky-night-left'
  const partnerSkyClass = partnerIsMorning ? 'sky-morning-right' : 'sky-night-right'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleDragEnd(_e, info) {
    if (info.offset.x < -80) {
      navigate('/bedroom')
    }
  }

  return (
    <div className="home-page">
      <motion.div
        className="home-app"
        ref={appRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.3, right: 0 }}
        onDragEnd={handleDragEnd}
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
            {/* Bedroom door — invisible left-side click zone */}
            <button
              className="home-door-left"
              onClick={() => navigate('/bedroom')}
              aria-label="Go to bedroom"
            />

            {/* Ceiling lights — left = user, right = SO */}
            <div className="home-lights">
              <button
                className="home-light home-light-left home-light--on"
                onClick={() => { setPendingMood(userMood); setMoodModalOpen(true) }}
                aria-label="Open mood light"
              >
                <div
                  className="home-light-fixture"
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
              </button>

              <button
                className={`home-light home-light-right ${soLightOn ? 'home-light--on' : ''}`}
                onClick={() => setSoLightOn(v => !v)}
                aria-label={soLightOn ? "Turn SO's light off" : "Turn SO's light on"}
              >
                <div className="home-light-fixture" />
                <div className="home-light-beam" />
              </button>
            </div>

            <div className="home-house-interior">
              <div className="home-house-left" />
              <div className="home-house-right" />
            </div>

            {/* ── Right-side shelves ── */}
            <div className="home-shelf home-shelf--right-top" />
            <div className="home-shelf home-shelf--right-mid" />

            {/* ── Left bookshelf — empty ── */}
            <div className="home-bookshelf">
              <div className="home-bookshelf-shelf" />
              <div className="home-bookshelf-shelf" />
              <div className="home-bookshelf-shelf" />
            </div>

            {/* Plush armchair — in front of left bookshelf */}
            <img src={chairPlushSvg} className="home-chair-plush" alt="" aria-hidden="true" />

            {/* Basic table — right room, centered, at floor level */}
            <img src={tableBasicSvg} className="home-table-basic" alt="" aria-hidden="true" />
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
                  onClick={() => { setUserMood(pendingMood); setMoodModalOpen(false) }}
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
