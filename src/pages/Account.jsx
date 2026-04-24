import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Account() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth()

  const [name, setName]           = useState(profile?.display_name || '')
  const [email, setEmail]         = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving]       = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg]         = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [pwErr, setPwErr]         = useState('')

  const fieldLabel = (text) => (
    <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--text-3)', display:'block', marginBottom:5 }}>{text}</label>
  )

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(''); setProfileErr('')
    setSaving(true)
    const { error } = await updateProfile({ display_name: name })
    setSaving(false)
    if (error) setProfileErr(error.message)
    else setProfileMsg('Profile updated.')
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPwMsg(''); setPwErr('')
    if (newPassword !== confirmPassword) { setPwErr('Passwords do not match'); return }
    if (newPassword.length < 6) { setPwErr('Password must be at least 6 characters'); return }
    setSavingPw(true)
    const { error } = await updatePassword(newPassword)
    setSavingPw(false)
    if (error) setPwErr(error.message)
    else { setPwMsg('Password updated.'); setNewPassword(''); setConfirmPassword('') }
  }

  return (
    <div className="auth-page" style={{ alignItems:'flex-start', paddingTop:60 }}>
      <div style={{ width:'100%', maxWidth:460 }}>

        {/* Back link */}
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-3)', textDecoration:'none', fontSize:13, marginBottom:24, fontFamily:'DM Sans,sans-serif' }}>
          ← Back to Pipeline
        </Link>

        {/* Profile card */}
        <div className="auth-card" style={{ marginBottom:16 }}>
          <div className="auth-title" style={{ fontSize:18, marginBottom:20 }}>Account Settings</div>

          {profileErr && <div className="auth-error">{profileErr}</div>}
          {profileMsg && <div style={{ fontSize:13, color:'#15803D', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:7, padding:'8px 12px', marginBottom:14 }}>{profileMsg}</div>}

          <form onSubmit={handleSaveProfile}>
            <div className="auth-field">
              {fieldLabel('Display Name')}
              <input className="auth-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="auth-field">
              {fieldLabel('Email')}
              <input className="auth-input" type="email" value={email} disabled style={{ opacity:0.6, cursor:'not-allowed' }} />
              <div style={{ fontSize:11, color:'var(--text-4)', marginTop:4 }}>Email cannot be changed here.</div>
            </div>
            <button className="auth-btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password card */}
        <div className="auth-card" style={{ marginBottom:16 }}>
          <div style={{ fontFamily:'Libre Baskerville,serif', fontWeight:700, fontSize:15, color:'var(--text-1)', marginBottom:18 }}>Change Password</div>

          {pwErr && <div className="auth-error">{pwErr}</div>}
          {pwMsg && <div style={{ fontSize:13, color:'#15803D', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:7, padding:'8px 12px', marginBottom:14 }}>{pwMsg}</div>}

          <form onSubmit={handleSavePassword}>
            <div className="auth-field">
              {fieldLabel('New Password')}
              <input className="auth-input" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="auth-field">
              {fieldLabel('Confirm Password')}
              <input className="auth-input" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password" />
            </div>
            <button className="auth-btn-primary" type="submit" disabled={savingPw}>
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <div className="auth-card">
          <div style={{ fontFamily:'Libre Baskerville,serif', fontWeight:700, fontSize:15, color:'var(--text-1)', marginBottom:12 }}>Sign Out</div>
          <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:16 }}>You'll be returned to the login screen.</p>
          <button className="auth-btn-secondary" onClick={signOut}>Sign Out</button>
        </div>

      </div>
    </div>
  )
}
