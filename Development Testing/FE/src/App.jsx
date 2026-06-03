import React, { useState } from "react"
import Login from "./pages/Login"
import RoomList from "./pages/RoomList"
import ChatRoom from "./pages/ChatRoom"
import AdminDashboard from "./pages/AdminDashboard"
import "./index.css"

export default function App() {
  const [page, setPage] = useState("login")
  const [username, setUsername] = useState("")
  const [room, setRoom] = useState(null)

  if (page === "login")
    return <Login onLogin={n => { setUsername(n); setPage("rooms") }} onAdmin={() => setPage("admin")} />
  if (page === "rooms")
    return <RoomList username={username} onJoinRoom={r => { setRoom(r); setPage("chat") }} onAdmin={() => setPage("admin")} onLogout={() => { setUsername(""); setPage("login") }} />
  if (page === "chat")
    return <ChatRoom username={username} room={room} onBack={() => setPage("rooms")} onAdmin={() => setPage("admin")} />
  if (page === "admin")
    return <AdminDashboard onBack={() => setPage(username ? "rooms" : "login")} />
}