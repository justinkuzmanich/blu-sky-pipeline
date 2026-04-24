import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PipelinePage from './pages/PipelinePage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'DM Sans,sans-serif', color:'var(--text-3)' }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/account" element={
        <ProtectedRoute><Account /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><PipelinePage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
