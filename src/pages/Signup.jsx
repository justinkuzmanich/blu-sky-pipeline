import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error, data } = await signUp(email, password, name)
    setLoading(false)
    if (error) { setError(error.message); return }
    if (data?.session) navigate('/')
    else setCheckEmail(true)
  }

  const fieldLabel = (text) => (
    <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--text-3)', display:'block', marginBottom:5 }}>{text}</label>
  )

  const footer = (
    <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.5px', textAlign:'center' }}>
      Blu Sky Code 2026
    </div>
  )

  if (checkEmail) {
    return (
      <div className="auth-page">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
          <div className="auth-card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>✉️</div>
            <div className="auth-title">Check your email</div>
            <div className="auth-subtitle" style={{ marginBottom:20 }}>
              We sent a confirmation link to <strong style={{ color:'var(--text-1)' }}>{email}</strong>. Click it to activate your account, then sign in.
            </div>
            <Link to="/login" style={{ color:'var(--orange)', textDecoration:'none', fontSize:13, fontWeight:500 }}>
              ← Back to Sign In
            </Link>
          </div>
          {footer}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
        <div className="auth-card">
          <div className="auth-title">Create Account</div>
          <div className="auth-subtitle">Start managing your pipeline</div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              {fieldLabel('Your Name')}
              <input className="auth-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" required />
            </div>
            <div className="auth-field">
              {fieldLabel('Email')}
              <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div className="auth-field">
              {fieldLabel('Password')}
              <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters" required />
            </div>
            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
        {footer}
      </div>
    </div>
  )
}
