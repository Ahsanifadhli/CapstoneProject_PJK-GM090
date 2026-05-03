import { useEffect, useState } from 'react'
import { getRooms } from '../services/api'

export default function RoomList({ username, onJoinRoom, onAdmin }) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    getRooms().then((res) => setRooms(res.data))
  }, [])

  return (
    <div className="page-center">
      <div className="card">
        <h1>Halo, {username}!</h1>
        <p className="subtitle">Pilih forum yang ingin Anda masuki</p>

        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="room-card"
              onClick={() => onJoinRoom(room)}
            >
              <span className="room-name">{room.name}</span>
              <span className="room-arrow">›</span>
            </div>
          ))}
        </div>

        <div className="admin-link">
          <button className="btn btn-ghost" onClick={onAdmin}>
            Buka Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
