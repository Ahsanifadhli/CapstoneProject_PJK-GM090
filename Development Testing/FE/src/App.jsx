import React, { useState, useEffect } from "react"
import Login          from "./pages/Login"
import AdminLogin     from "./pages/AdminLogin"
import RoomList       from "./pages/RoomList"
import ChatRoom       from "./pages/ChatRoom"
import AdminDashboard from "./pages/AdminDashboard"
import SplashScreen   from "./pages/SplashScreen"
import "./index.css"

export default function App() {
  const [splash, setSplash]     = useState(true)
  const [page, setPage]         = useState("login")
  const [username, setUsername] = useState("")
  const [room, setRoom]         = useState(null)

  useEffect(() => {
    // Splash hilang setelah 2800ms
    const t = setTimeout(() => setSplash(false), 2800)
    return () => clearTimeout(t)
  }, [])

  if (splash) return <SplashScreen />

  if (page === "login")
    return (
      <Login
        onLogin={n => { setUsername(n); setPage("rooms") }}
        onAdminLogin={() => setPage("adminlogin")}
      />
    )

  if (page === "adminlogin")
    return (
      <AdminLogin
        onSuccess={() => setPage("admin")}
        onBack={() => setPage("login")}
      />
    )

  if (page === "rooms")
    return (
      <RoomList
        username={username}
        onJoinRoom={r => { setRoom(r); setPage("chat") }}
        onLogout={() => { setUsername(""); setPage("login") }}
      />
    )

  if (page === "chat")
    return (
      <ChatRoom
        username={username}
        room={room}
        onBack={() => setPage("rooms")}
      />
    )

  if (page === "admin")
    return (
      <AdminDashboard
        onBack={() => setPage(username ? "rooms" : "login")}
      />
    )

  // Fallback
  return <Login onLogin={n => { setUsername(n); setPage("rooms") }} onAdminLogin={() => setPage("adminlogin")} />
}