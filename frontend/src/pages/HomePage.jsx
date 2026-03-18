import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './HomePage.css'

export default function HomePage({ session }) {
  const navigate = useNavigate()
  const username = session.user.user_metadata?.username ?? session.user.email?.replace('@connected.app', '')

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="home-page">
      <nav className="home-nav">
        <span className="home-nav-brand">Connected</span>
        <div className="home-nav-right">
          <button className="home-profile-link" onClick={() => navigate('/profile')}>
            My Profile
          </button>
          <button className="home-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </nav>
      <div className="home-content">
        <div className="home-card">
          <h1 className="home-title">Welcome</h1>
          <p className="home-email">You're signed in as {username}</p>
        </div>
      </div>
    </div>
  )
}
