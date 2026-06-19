import React, { useState, useEffect } from "react"
import SplashScreen   from "./pages/SplashScreen"
import AuthPage       from "./pages/AuthPage"
import AdminLogin     from "./pages/AdminLogin"
import RoomList       from "./pages/RoomList"
import ChatRoom       from "./pages/ChatRoom"
import AdminDashboard from "./pages/AdminDashboard"
import ProfilePage    from "./pages/ProfilePage"
import "./index.css"

export default function App() {
  const [splash, setSplash] = useState(true)

  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aishield_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const [page, setPage] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aishield_user')
      return saved ? 'rooms' : 'auth'
    } catch { return 'auth' }
  })

  const [room, setRoom] = useState(null)

  // displayName terpisah agar bisa diupdate dari ProfilePage tanpa reload
  const [displayName, setDisplayName] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aishield_user')
      return saved ? JSON.parse(saved)?.username || '' : ''
    } catch { return '' }
  })

  const [userEmail, setUserEmail] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aishield_user')
      return saved ? JSON.parse(saved)?.email || '' : ''
    } catch { return '' }
  })

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2800)
    return () => clearTimeout(t)
  }, [])

  if (splash) return <SplashScreen />

  const handleLogin = (username, email, token) => {
    const userData = { username, email }
    sessionStorage.setItem('aishield_user', JSON.stringify(userData))
    sessionStorage.setItem('aishield_token', token || '')
    setUser(userData)
    setDisplayName(username)
    setUserEmail(email)
    setPage('rooms')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('aishield_user')
    sessionStorage.removeItem('aishield_token')
    setUser(null)
    setDisplayName('')
    setUserEmail('')
    setPage('auth')
  }

  // Dipanggil dari ProfilePage saat user simpan nama baru
  const handleUpdateUsername = (newName) => {
    const updated = { ...user, username: newName }
    setUser(updated)
    setDisplayName(newName)
    sessionStorage.setItem('aishield_user', JSON.stringify(updated))
  }

  if (page === 'auth')
    return (
      <AuthPage
        onLogin={handleLogin}
        onAdminLogin={() => setPage('adminlogin')}
      />
    )

  if (page === 'adminlogin')
    return (
      <AdminLogin
        onSuccess={() => setPage('admin')}
        onBack={() => setPage(user ? 'rooms' : 'auth')}
      />
    )

  if (page === 'rooms')
    return (
      <RoomList
        username={displayName}
        onJoinRoom={(r) => { setRoom(r); setPage('chat') }}
        onLogout={handleLogout}
        onProfile={() => setPage('profile')}
      />
    )

  if (page === 'chat')
    return (
      <ChatRoom
        username={displayName}
        room={room}
        onBack={() => setPage('rooms')}
      />
    )

  if (page === 'admin')
    return (
      <AdminDashboard
        onBack={() => setPage(user ? 'rooms' : 'auth')}
      />
    )

  if (page === 'profile')
    return (
      <ProfilePage
        username={displayName}
        email={userEmail}
        onBack={() => setPage('rooms')}
        onLogout={handleLogout}
        onUpdateUsername={handleUpdateUsername}
      />
    )

  return <AuthPage onLogin={handleLogin} onAdminLogin={() => setPage('adminlogin')} />
}