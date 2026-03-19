import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import BedroomPage from './pages/BedroomPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ session, children }) {
  if (session === undefined) return <div className="app-loading">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ session, children }) {
  if (session === undefined) return <div className="app-loading">Loading…</div>
  if (session) return <Navigate to="/" replace />
  return children
}

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute session={session}>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <HomePage session={session} />
          </ProtectedRoute>
        } />
        <Route path="/bedroom" element={
          <ProtectedRoute session={session}>
            <BedroomPage session={session} />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute session={session}>
            <ProfilePage session={session} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
