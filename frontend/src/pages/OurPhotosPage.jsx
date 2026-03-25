import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import './OurPhotosPage.css'

function PhotoIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="56" height="40" rx="6" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="4 3"/>
      <circle cx="22" cy="26" r="5" stroke="#fb7185" strokeWidth="2"/>
      <path d="M4 40 L18 28 L28 38 L38 30 L60 44" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="48" cy="20" r="8" fill="#3d1a30" stroke="#fb7185" strokeWidth="2"/>
      <line x1="48" y1="16" x2="48" y2="24" stroke="#fb7185" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="20" x2="52" y2="20" stroke="#fb7185" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function getDateParts(dateStr) {
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' })
  }
}

function groupByDate(photos) {
  const groups = {}
  for (const photo of photos) {
    const dateKey = new Date(photo.created_at).toLocaleDateString('en-CA') // YYYY-MM-DD
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(photo)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, photos]) => ({ date, photos }))
}

export default function OurPhotosPage({ session }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const touchStartX = useRef(0)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [optionsPhotoId, setOptionsPhotoId] = useState(null)
  const [viewerPhotos, setViewerPhotos] = useState(null)
  const [viewerIndex, setViewerIndex] = useState(0)

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    fetchProfile()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchPhotos()
  }, [userId, partnerId])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', userId)
      .single()
    if (data?.partner_id) setPartnerId(data.partner_id)
  }

  async function fetchPhotos() {
    setLoading(true)
    let query = supabase
      .from('couple_photos')
      .select('*')
      .order('created_at', { ascending: false })

    if (partnerId) {
      query = query.or(`uploaded_by.eq.${userId},uploaded_by.eq.${partnerId}`)
    } else {
      query = query.eq('uploaded_by', userId)
    }

    const { data } = await query
    setPhotos(data || [])
    setLoading(false)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedFile(null)
    setPreview(null)
    setCaption('')
    setUploadError(null)
  }

  async function handleAdd() {
    if (!selectedFile || uploading) return
    setUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('couple-photos')
        .upload(path, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('couple-photos')
        .getPublicUrl(uploadData.path)

      const { error: insertError } = await supabase.from('couple_photos').insert({
        uploaded_by: userId,
        partner_id: partnerId || null,
        image_url: publicUrl,
        caption: caption.trim()
      })

      if (insertError) throw insertError

      closeModal()
      fetchPhotos()
    } catch (err) {
      console.error('Upload failed:', err)
      const msg = err?.message || ''
      if (msg.includes('Bucket not found')) {
        setUploadError('Storage bucket not set up yet. Please create a "couple-photos" bucket in your Supabase Storage dashboard.')
      } else {
        setUploadError('Upload failed. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo) {
    setOptionsPhotoId(null)
    try {
      const urlParts = photo.image_url.split('/couple-photos/')
      if (urlParts[1]) {
        await supabase.storage.from('couple-photos').remove([urlParts[1]])
      }
      await supabase.from('couple_photos').delete().eq('id', photo.id)
      // Close viewer if the deleted photo was the last one, or adjust index
      if (viewerPhotos) {
        const remaining = viewerPhotos.filter(p => p.id !== photo.id)
        if (remaining.length === 0) {
          closeViewer()
        } else {
          setViewerPhotos(remaining)
          setViewerIndex(i => Math.min(i, remaining.length - 1))
        }
      }
      fetchPhotos()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function handleDownload(photo) {
    setOptionsPhotoId(null)
    try {
      const res = await fetch(photo.image_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.caption ? `${photo.caption}.jpg` : 'photo.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  function openViewer(dayPhotos) {
    setViewerPhotos(dayPhotos)
    setViewerIndex(0)
  }

  function closeViewer() {
    setViewerPhotos(null)
    setViewerIndex(0)
  }

  function handleSwipeStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleSwipeEnd(e) {
    if (!viewerPhotos) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return
    if (diff > 0 && viewerIndex < viewerPhotos.length - 1) {
      setViewerIndex(i => i + 1)
    } else if (diff < 0 && viewerIndex > 0) {
      setViewerIndex(i => i - 1)
    }
  }

  const optionsPhoto = photos.find(p => p.id === optionsPhotoId)
  const groups = groupByDate(photos)

  return (
    <div className="photos-page">
      {/* Header */}
      <div className="photos-header">
        <button className="photos-back-btn" onClick={() => navigate('/')} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className="photos-title">Our Photos</h1>
        <button className="photos-add-btn" onClick={() => setModalOpen(true)} aria-label="Add photo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Feed */}
      <div className="photos-feed">
        {loading && (
          <p className="photos-empty">Loading…</p>
        )}
        {!loading && photos.length === 0 && (
          <div className="photos-empty-state">
            <PhotoIcon />
            <p>No photos yet.<br/>Tap + to add your first one.</p>
          </div>
        )}
        {groups.map(group => {
          const thumbs = group.photos.slice(0, 4)
          const extra = group.photos.length - 4
          const captions = group.photos.filter(p => p.caption).map(p => p.caption)

          return (
            <div key={group.date} className="photos-day-row">
              <div className="photos-day-date">
                <span className="photos-day-date-num">{getDateParts(group.date + 'T12:00:00').day}</span>
                <span className="photos-day-date-month">{getDateParts(group.date + 'T12:00:00').month}</span>
              </div>
              <div className="photos-day-grid" onClick={() => openViewer(group.photos)}>
                {thumbs.map((photo, i) => (
                  <div key={photo.id} className="photos-day-thumb-wrap">
                    <img src={photo.image_url} alt={photo.caption || ''} className="photos-day-thumb" />
                    {i === 3 && extra > 0 && (
                      <div className="photos-day-more">+{extra}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="photos-day-captions">
                {captions.length > 0
                  ? captions.map((c, i) => (
                      <p key={i} className="photos-day-caption-text">{c}</p>
                    ))
                  : <p className="photos-day-caption-empty">No captions</p>
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {viewerPhotos && (
          <motion.div
            className="photos-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            <button className="photos-viewer-close" onClick={closeViewer} aria-label="Close">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            <div className="photos-viewer-img-wrap">
              <AnimatePresence mode="wait">
                <motion.img
                  key={viewerPhotos[viewerIndex].id}
                  src={viewerPhotos[viewerIndex].image_url}
                  alt={viewerPhotos[viewerIndex].caption || ''}
                  className="photos-viewer-img"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
            </div>

            <div className="photos-viewer-info">
              {viewerPhotos[viewerIndex].caption && (
                <p className="photos-viewer-caption">{viewerPhotos[viewerIndex].caption}</p>
              )}
              <span className="photos-viewer-counter">
                {viewerIndex + 1} / {viewerPhotos.length}
              </span>
            </div>

            <button
              className="photos-viewer-options-btn"
              onClick={(e) => { e.stopPropagation(); setOptionsPhotoId(viewerPhotos[viewerIndex].id) }}
              aria-label="Options"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="19" cy="12" r="2"/>
              </svg>
            </button>

            {viewerIndex > 0 && (
              <button className="photos-viewer-prev" onClick={() => setViewerIndex(i => i - 1)} aria-label="Previous">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
            )}
            {viewerIndex < viewerPhotos.length - 1 && (
              <button className="photos-viewer-next" onClick={() => setViewerIndex(i => i + 1)} aria-label="Next">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Modal */}
      <AnimatePresence>
        {optionsPhoto && (
          <>
            <motion.div
              className="photos-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOptionsPhotoId(null)}
            />
            <motion.div
              className="photos-options-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) setOptionsPhotoId(null) }}
            >
              <div className="photos-modal-handle" />
              <button className="photos-options-item" onClick={() => handleDownload(optionsPhoto)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download Image
              </button>
              <button className="photos-options-item photos-options-item--delete" onClick={() => handleDelete(optionsPhoto)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Photo Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              className="photos-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="photos-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) closeModal() }}
            >
              <div className="photos-modal-handle" />
              <h2 className="photos-modal-title">Add Photo</h2>

              <button className="photos-picker" onClick={() => fileInputRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="Preview" className="photos-picker-preview" />
                  : <PhotoIcon />
                }
                {!preview && <span className="photos-picker-hint">Tap to choose a photo</span>}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <textarea
                className="photos-caption-input"
                placeholder="Add a caption…"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={2}
              />

              {uploadError && <p className="photos-upload-error">{uploadError}</p>}

              <button
                className="photos-submit-btn"
                onClick={handleAdd}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading…' : 'Add'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
