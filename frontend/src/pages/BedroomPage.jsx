import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import sunSvg from '../assets/sun.svg'
import './HomePage.css'

function isMorning(tz) {
  if (!tz) return true
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
    10
  )
  return hour >= 6 && hour < 18
}

export default function BedroomPage({ session }) {
  const navigate = useNavigate()
  const [userTz, setUserTz] = useState(() => localStorage.getItem('connected_user_tz') || null)
  const [partnerTz, setPartnerTz] = useState(() => localStorage.getItem('connected_partner_tz') || null)

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

  return (
    <div className="home-page">
      <motion.div
        className="home-app"
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
            {/* Home door — invisible right-side click zone */}
            <button
              className="home-door-right"
              onClick={() => navigate('/')}
              aria-label="Go to home"
            />

            <div className="home-house-interior">
              <div className="home-house-left" />
              <div className="home-house-right" />
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

      </motion.div>
    </div>
  )
}
