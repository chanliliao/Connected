import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProfilePage.css'

export default function ProfilePage({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (error) {
        setError(error.message)
      } else {
        setProfile(data)
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setBirthday(data.birthday ?? '')
      }
    }
    loadProfile()
  }, [session.user.id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, birthday: birthday || null })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setError(error.message)
      return
    }
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!profile) return <div className="profile-loading">Loading…</div>

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">My Profile</h1>

        <div className="profile-field-row">
          <span className="profile-field-label">Username</span>
          <span className="profile-field-value">{profile.username}</span>
        </div>
        <div className="profile-field-row">
          <span className="profile-field-label">Role</span>
          <span className="profile-field-value">{profile.role ?? 'user'}</span>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <input
            className="profile-input"
            placeholder="First Name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
          <input
            className="profile-input"
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
          <input
            className="profile-input profile-input-date"
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
          />
          <div className="profile-actions">
            <button className="profile-btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="profile-btn-secondary" type="button" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </form>

        {success && <p className="profile-success-msg">Changes saved successfully.</p>}
        {error && <p className="profile-error">{error}</p>}

        <div className="profile-danger-zone">
          <button className="profile-btn-danger" type="button" onClick={handleDelete}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
