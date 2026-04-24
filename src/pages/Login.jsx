import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="auth-page">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
      <div className="auth-card">
        <div className="auth-title">Blu Sky Pipeline</div>
        <div className="auth-subtitle">Sign in to your account</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--text-3)', display:'block', marginBottom:5 }}>Email</label>
            <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div className="auth-field">
            <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--text-3)', display:'block', marginBottom:5 }}>Password</label>
            <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.5px', textAlign:'center' }}>
        Blu Sky Code 2026
      </div>
      </div>
    </div>
  )
}
