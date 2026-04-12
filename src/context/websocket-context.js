import { createContext, useContext } from 'react'

const WebSocketContext = createContext(null)

export function useWebSocket() {
  return useContext(WebSocketContext)
}

export default WebSocketContext