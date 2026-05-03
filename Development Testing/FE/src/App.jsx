import { useState } from 'react'
import Login from './pages/Login'
import ChatRoom from './pages/ChatRoom'
import AdminDashboard from './pages/AdminDashboard'

const DEFAULT_ROOM = { id: 'forum-aishield', name: 'Forum AI SHIELD' }

export default function App() {
  const [page, setPage] = useState('login')
  const [username, setUsername] = useState('')

  if (page === 'login') {
    return (
      <Login
        onLogin={(name) => { setUsername(name); setPage('chat') }}
        onAdmin={() => setPage('admin')}
      />
    )
  }

  if (page === 'chat') {
    return (
      <ChatRoom
        username={username}
        room={DEFAULT_ROOM}
        onBack={() => setPage('login')}
        onAdmin={() => setPage('admin')}
      />
    )
  }

  if (page === 'admin') {
    return <AdminDashboard onBack={() => setPage('login')} />
  }
}
