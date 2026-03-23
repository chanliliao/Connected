import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import './NotesPage.css'

function EnvelopeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="16" width="52" height="34" rx="4" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="4 3"/>
      <path d="M6 20l26 18 26-18" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="48" cy="22" r="8" fill="#3d1a30" stroke="#fb7185" strokeWidth="2"/>
      <line x1="48" y1="18" x2="48" y2="26" stroke="#fb7185" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="22" x2="52" y2="22" stroke="#fb7185" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function SmallHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )
}

function BigHeart() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )
}

function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatDateParts(dateStr) {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()
  return { month, day, year }
}

function groupByDate(notes) {
  const groups = {}
  for (const note of notes) {
    const key = formatDateFull(note.created_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(note)
  }
  return Object.entries(groups)
}

export default function NotesPage({ session }) {
  const navigate = useNavigate()

  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [writeOpen, setWriteOpen] = useState(false)
  const [detailNote, setDetailNote] = useState(null)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [userName, setUserName] = useState('')
  const [partnerName, setPartnerName] = useState('')

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    fetchProfile()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchNotes()
  }, [userId, partnerId])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, username, partner_id, partner_name')
      .eq('id', userId)
      .single()
    if (data) {
      setUserName(data.first_name || data.username || 'You')
      setPartnerName(data.partner_name || 'Your SO')
      if (data.partner_id) setPartnerId(data.partner_id)
    }
  }

  async function fetchNotes() {
    setLoading(true)
    let query = supabase
      .from('couple_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (partnerId) {
      query = query.or(`created_by.eq.${userId},created_by.eq.${partnerId}`)
    } else {
      query = query.eq('created_by', userId)
    }

    const { data } = await query
    setNotes(data || [])
    setLoading(false)
  }

  function closeWriteModal() {
    setWriteOpen(false)
    setContent('')
    setError(null)
  }

  async function handleSend() {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      const { error: insertError } = await supabase.from('couple_notes').insert({
        created_by: userId,
        partner_id: partnerId || null,
        content: content.trim()
      })
      if (insertError) throw insertError
      closeWriteModal()
      fetchNotes()
    } catch (err) {
      console.error('Send failed:', err)
      setError('Failed to send note. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(note) {
    setDetailNote(null)
    try {
      await supabase.from('couple_notes').delete().eq('id', note.id)
      fetchNotes()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function getNoteSenderName(note) {
    return note.created_by === userId ? userName : partnerName
  }

  function getNoteRecipientName(note) {
    return note.created_by === userId ? partnerName : userName
  }

  const dateGroups = groupByDate(notes)

  return (
    <div className="notes-page">
      {/* Header */}
      <div className="notes-header">
        <button className="notes-back-btn" onClick={() => navigate('/')} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className="notes-title">Notes</h1>
        <button className="notes-add-btn" onClick={() => setWriteOpen(true)} aria-label="Write note">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Feed */}
      <div className="notes-feed">
        {loading && <p className="notes-loading">Loading…</p>}
        {!loading && notes.length === 0 && (
          <div className="notes-empty-state">
            <EnvelopeIcon />
            <p>No notes yet.<br/>Tap + to write your first one.</p>
          </div>
        )}
        {dateGroups.map(([dateLabel, groupNotes]) => (
          <div key={dateLabel} className="notes-date-section">
            <span className="notes-date-label">{dateLabel}</span>
            {groupNotes.map(note => (
              <div key={note.id} className="notes-card" onClick={() => setDetailNote(note)}>
                <span className="notes-card-from">From {getNoteSenderName(note)}</span>
                <p className="notes-card-preview">{note.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Detail Modal — A Special Note */}
      <AnimatePresence>
        {detailNote && (
          <>
            <motion.div
              className="notes-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailNote(null)}
            />
            <motion.div
              className="notes-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) setDetailNote(null) }}
            >
              <div className="notes-modal-handle" />
              <h2 className="notes-modal-title">A Special Note</h2>

              <div className="notes-letter">
                <div className="notes-letter-header">
                  <div className="notes-letter-names">
                    <span className="notes-letter-from">From: {getNoteSenderName(detailNote)}</span>
                    <span className="notes-letter-to">To: {getNoteRecipientName(detailNote)}</span>
                  </div>
                  <span className="notes-letter-date">
                    {(() => {
                      const { month, day, year } = formatDateParts(detailNote.created_at)
                      return `${month} ${day}, ${year}`
                    })()}
                  </span>
                </div>
                <div className="notes-letter-divider" />
                <div className="notes-letter-body">{detailNote.content}</div>
                <span className="notes-letter-heart-small"><SmallHeart /></span>
                <span className="notes-letter-heart-big"><BigHeart /></span>
              </div>

              {detailNote.created_by === userId && (
                <button
                  className="notes-submit-btn"
                  style={{ background: 'rgba(251, 113, 133, 0.12)', color: '#fb7185' }}
                  onClick={() => handleDelete(detailNote)}
                >
                  Delete Note
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Write Modal */}
      <AnimatePresence>
        {writeOpen && (
          <>
            <motion.div
              className="notes-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeWriteModal}
            />
            <motion.div
              className="notes-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) closeWriteModal() }}
            >
              <div className="notes-modal-handle" />
              <h2 className="notes-modal-title">Write a Note</h2>

              <div className="notes-letter">
                <div className="notes-letter-header">
                  <div className="notes-letter-names">
                    <span className="notes-letter-from">From: {userName}</span>
                    <span className="notes-letter-to">To: {partnerName}</span>
                  </div>
                  <span className="notes-letter-date">
                    {(() => {
                      const now = new Date()
                      const month = now.toLocaleDateString('en-US', { month: 'long' })
                      const day = now.getDate()
                      const year = now.getFullYear()
                      return `${month} ${day}, ${year}`
                    })()}
                  </span>
                </div>
                <div className="notes-letter-divider" />
                <textarea
                  className="notes-letter-textarea"
                  placeholder="Write your note…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={5}
                />
                <span className="notes-letter-heart-small"><SmallHeart /></span>
                <span className="notes-letter-heart-big"><BigHeart /></span>
              </div>

              {error && <p className="notes-error">{error}</p>}

              <button
                className="notes-submit-btn"
                onClick={handleSend}
                disabled={!content.trim() || sending}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
