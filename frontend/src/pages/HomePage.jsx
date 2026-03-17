import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './HomePage.css'

export default function HomePage({ session }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">Welcome</h1>
        <p className="home-email">You're signed in as {session.user.user_metadata?.username ?? session.user.email?.replace('@connected.app', '')}</p>
        <button className="home-logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  )
}
