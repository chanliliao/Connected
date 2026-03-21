import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProfilePage.css'

const TIMEZONES = Intl.supportedValuesOf('timeZone')

function tzLabel(tz) {
  return tz.split('/').pop().replace(/_/g, ' ')
}

function TzPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const filtered = query.length > 0
    ? TIMEZONES.filter(tz => tzLabel(tz).toLowerCase().includes(query.toLowerCase())).slice(0, 80)
    : TIMEZONES.slice(0, 80)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function select(tz) {
    onChange(tz)
    setQuery('')
    setOpen(false)
  }

  function toggle() {
    setOpen(v => !v)
    if (!open) setQuery('')
  }

  return (
    <div className="tz-picker" ref={ref}>
      <div
        className={`tz-picker-trigger${open ? ' tz-picker-trigger--open' : ''}`}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tz-picker-value">{tzLabel(value)}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="tz-picker-chevron-wrap"
        >
          <svg className="tz-picker-chevron" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="tz-picker-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="tz-picker-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="tz-picker-search-icon">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                className="tz-picker-search"
                placeholder="Search city…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <motion.ul
              className="tz-picker-list"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.025 } }
              }}
            >
              {filtered.map(tz => (
                <motion.li
                  key={tz}
                  className={`tz-picker-option${tz === value ? ' tz-picker-option--active' : ''}`}
                  onClick={() => select(tz)}
                  variants={{
                    hidden: { opacity: 0, x: -16 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {tzLabel(tz)}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getCurrentTime(timeZone) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProfilePage({ session }) {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [connectionOpen, setConnectionOpen] = useState(false)
  const [pairCode, setPairCode] = useState('')
  const [pairError, setPairError] = useState('')
  const [pairLoading, setPairLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [userTz, setUserTz] = useState(defaultTz)
  const [soTz, setSoTz] = useState('America/New_York')
  const [userTime, setUserTime] = useState(getCurrentTime(defaultTz))
  const [soTime, setSoTime] = useState(getCurrentTime('America/New_York'))

  const [specialDates, setSpecialDates] = useState([])
  const [newDateLabel, setNewDateLabel] = useState('')
  const [newDateInput, setNewDateInput] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (!error) {
        if (!data.pairing_code) {
          const arr = new Uint32Array(1)
          crypto.getRandomValues(arr)
          const generated = arr[0].toString(36).padStart(7, '0').substring(0, 8).toUpperCase()
          await supabase.from('profiles').update({ pairing_code: generated }).eq('id', session.user.id)
          data.pairing_code = generated
        }
        setProfile(data)
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setBirthday(data.birthday ?? '')
        if (data.user_tz) setUserTz(data.user_tz)
        if (data.partner_tz) setSoTz(data.partner_tz)
        if (data.special_dates?.length) setSpecialDates(data.special_dates)
      }
    }
    loadProfile()
  }, [session.user.id])

  useEffect(() => {
    const tick = () => {
      setUserTime(getCurrentTime(userTz))
      setSoTime(getCurrentTime(soTz))
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [userTz, soTz])

  const handleSave = useCallback(async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, birthday: birthday || null })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaveSuccess(true)
    }
  }, [firstName, lastName, birthday, session.user.id])

  async function handlePair() {
    setPairLoading(true)
    setPairError('')
    const { data, error } = await supabase.rpc('pair_with_code', { code: pairCode.trim() })
    setPairLoading(false)
    if (error || data?.error) {
      setPairError(error?.message || data.error)
    } else {
      setProfile(prev => ({ ...prev, partner_id: data.partner_id, partner_name: data.partner_name }))
      setPairCode('')
    }
  }

  async function handleUnpair() {
    await supabase.rpc('unpair_account')
    setProfile(prev => ({ ...prev, partner_id: null, partner_name: null }))
  }

  async function copyCode() {
    await navigator.clipboard.writeText(profile.pairing_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function shareCode() {
    const text = `Join me on Connected! My code: ${profile.pairing_code}`
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(profile.pairing_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  async function handleUserTzChange(tz) {
    setUserTz(tz)
    await supabase.rpc('update_user_tz', { new_tz: tz })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setSaveError(error.message)
      return
    }
    await supabase.auth.signOut()
    navigate('/login')
  }

  function addSpecialDate() {
    if (!newDateLabel.trim() && !newDateInput) return
    const updated = [...specialDates, { label: newDateLabel.trim(), date: newDateInput }]
    setSpecialDates(updated)
    setNewDateLabel('')
    setNewDateInput('')
    supabase.rpc('save_special_dates', { dates: updated }).then(({ error }) => {
      if (error) console.error('save_special_dates error:', error)
    })
  }

  function deleteSpecialDate(index) {
    const updated = specialDates.filter((_, i) => i !== index)
    setSpecialDates(updated)
    supabase.rpc('save_special_dates', { dates: updated }).then(({ error }) => {
      if (error) console.error('save_special_dates error:', error)
    })
  }

  const displayName = profile ? (firstName || profile.username || 'You') : 'You'
  const partnerName = profile?.partner_name || 'Your SO'

  if (!profile) return <div className="profile-loading">Loading…</div>

  return (
    <div className="profile-page">

      {/* Top bar */}
      <div className="profile-topbar">
        <button className="profile-back-btn" aria-label="Back to Home" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span className="profile-topbar-title">About Us</span>
        <button className="profile-gear-btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="profile-content">

        {/* Panel 1 — Us */}
        <div className="profile-panel profile-panel--borderless">
          <div className="profile-couple-row">
            <div className="profile-avatar-block">
              <div className="profile-avatar">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7H4z" />
                </svg>
              </div>
              <span className="profile-avatar-name">{displayName}</span>
            </div>

            <div className="profile-connector">
              <div className="profile-connector-line" />
              <span className="profile-connector-heart">♥</span>
              <div className="profile-connector-line" />
            </div>

            <button className="profile-avatar-btn" onClick={() => setConnectionOpen(true)} aria-label="Partner connection">
              <div className={`profile-avatar${!profile.partner_id ? ' profile-avatar--add' : ''}`}>
                {profile.partner_id ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7H4z" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                )}
              </div>
              <span className="profile-avatar-name">{profile.partner_id ? partnerName : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* Panel 2 — Timezones */}
        <div className="profile-panel">
          <h2 className="profile-panel-heading">Time Zones</h2>
          <div className="profile-tz-row">
            <div className="profile-tz-card">
              <span className="profile-tz-label">You</span>
              <div className="profile-tz-time">{userTime}</div>
              <TzPicker value={userTz} onChange={handleUserTzChange} />
            </div>

            <div className="profile-tz-card">
              <span className="profile-tz-label">Them</span>
              <div className="profile-tz-time">{soTime}</div>
              <div className="profile-tz-static">{soTz ? tzLabel(soTz) : '—'}</div>
            </div>
          </div>
        </div>

        {/* Panel 3 — Special Dates */}
        <div className="profile-panel">
          <h2 className="profile-panel-heading">Special Dates</h2>

          {/* Display list at top */}
          <div className="profile-dates-list">
            {specialDates.length === 0 && (
              <p className="profile-dates-empty">No special dates yet.</p>
            )}
            {specialDates.map((item, i) => (
              <div key={i} className="profile-date-row">
                <div className="profile-date-info">
                  <span className="profile-date-row-label">{item.label || '—'}</span>
                  <span className="profile-date-row-date">{item.date ? item.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') : '—'}</span>
                </div>
                <button className="profile-date-delete-btn" onClick={() => deleteSpecialDate(i)} aria-label="Remove date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Input section at bottom */}
          <div className="profile-date-add-row">
            <input
              className="profile-date-label-input"
              placeholder="Label"
              value={newDateLabel}
              onChange={e => setNewDateLabel(e.target.value)}
            />
            <input
              className="profile-date-input"
              type="date"
              value={newDateInput}
              onChange={e => setNewDateInput(e.target.value)}
            />
          </div>
          <button className="profile-add-date-btn" onClick={addSpecialDate}>+ Add Date</button>
        </div>

      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="profile-modal-backdrop" onClick={() => setSettingsOpen(false)}>
            <motion.div
              className="profile-modal-panel"
              onClick={e => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) setSettingsOpen(false)
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="profile-modal-handle" />

              {/* ── Your Info section ── */}
              <h2 className="profile-modal-heading">Your Info</h2>
              <form className="profile-modal-form" onSubmit={handleSave}>
                <input
                  className="profile-modal-input"
                  placeholder="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
                <input
                  className="profile-modal-input"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
                <input
                  className="profile-modal-input profile-modal-input-date"
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                />
                <button className="profile-modal-btn-save" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
              {saveSuccess && <p className="profile-modal-success">Changes saved successfully.</p>}
              {saveError && <p className="profile-modal-error">{saveError}</p>}

              <div className="profile-modal-separator" />
              <button className="profile-modal-btn-logout" type="button" onClick={handleLogout}>
                Log Out
              </button>
              <button className="profile-modal-btn-danger" type="button" onClick={handleDelete}>
                Delete Account
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connection modal */}
      <AnimatePresence>
        {connectionOpen && (
          <div className="profile-modal-backdrop" onClick={() => setConnectionOpen(false)}>
            <motion.div
              className="profile-modal-panel"
              onClick={e => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) setConnectionOpen(false)
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="profile-modal-handle" />

              {/* Status row */}
              <div className="profile-modal-status-row">
                <h2 className="profile-modal-heading">Connection</h2>
                <div className="profile-modal-status-badge-wrap">
                  <span className={`profile-modal-status-badge${profile.partner_id ? ' profile-modal-status-badge--paired' : ''}`}>
                    {profile.partner_id ? '♥ Paired' : '○ Not Paired'}
                  </span>
                  {profile.partner_id && (
                    <span className="profile-modal-status-name">with {profile.partner_name || 'Your SO'}</span>
                  )}
                </div>
              </div>

              {profile.partner_id ? (
                <button className="profile-modal-btn-unpair" onClick={handleUnpair}>
                  Unpair
                </button>
              ) : (
                <div className="profile-modal-pair-row">
                  <input
                    className="profile-modal-input profile-modal-pair-input"
                    placeholder="Enter partner's code…"
                    value={pairCode}
                    onChange={e => setPairCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                  <button
                    className="profile-modal-btn-connect"
                    onClick={handlePair}
                    disabled={pairLoading || pairCode.trim().length < 4}
                  >
                    {pairLoading ? '…' : 'Connect'}
                  </button>
                </div>
              )}

              {pairError && <p className="profile-modal-error">{pairError}</p>}

              <div className="profile-modal-code-block">
                <span className="profile-modal-code-label">Your code</span>
                <div className="profile-modal-code-display" onClick={copyCode}>
                  <span className="profile-modal-code-value">{profile.pairing_code}</span>
                </div>
                <div className="profile-modal-code-actions">
                  <button className="profile-modal-code-btn" onClick={copyCode}>
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="profile-modal-code-btn" onClick={shareCode}>Share</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
