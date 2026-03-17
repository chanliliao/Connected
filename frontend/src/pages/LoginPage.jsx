import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './LoginPage.css'

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSent, setSignUpSent] = useState(false)
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signin') {
      localStorage.setItem('connected_persist', keepMeSignedIn ? 'true' : 'false')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSignUpSent(true)
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1 className="login-title">Connected</h1>
          <p className="login-subtitle">for the two of you</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setSignUpSent(false); setFirstName(''); setLastName(''); setBirthday('') }}
          >
            Login
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSignUpSent(false); setFirstName(''); setLastName(''); setBirthday('') }}
          >
            Sign Up
          </button>
        </div>

        {signUpSent ? (
          <div className="login-confirm-msg">
            Check your email to confirm your account, then sign in.
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              className="login-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {mode === 'signup' && (
              <>
                <div className="login-name-row">
                  <input className="login-input" type="text" placeholder="First Name"
                    value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  <input className="login-input" type="text" placeholder="Last Name"
                    value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
                <input className="login-input login-input-date" type="date"
                  value={birthday} onChange={e => setBirthday(e.target.value)}
                  required placeholder="Birthday" />
              </>
            )}

            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />

            {mode === 'signin' && (
              <div className="login-forgot-row">
                <button type="button" className="login-forgot-link">Forgot password?</button>
                <button type="button" className="login-forgot-link">Forgot email?</button>
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <button className="login-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Sign Up'}
            </button>

            {mode === 'signin' && (
              <label className="login-keep-row">
                <input
                  type="checkbox"
                  checked={keepMeSignedIn}
                  onChange={e => setKeepMeSignedIn(e.target.checked)}
                />
                Keep me signed in
              </label>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
