import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_WS_URL || 'http://localhost:3001'
console.log('[socketClient] Attempting to connect to:', SOCKET_URL)

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  autoConnect: true
})

socket.on('connect', () => {
  console.log('[socketClient] ✅ Connected successfully', socket.id)
})

socket.on('connect_error', (error) => {
  console.warn('[socketClient] ❌ Connection error:', error.message)
})

socket.on('disconnect', (reason) => {
  console.warn('[socketClient] ⚠️ Disconnected:', reason)
})

// Simple throttled subscriber registry
const throttles = new Map() // event -> { ms, timer, lastPayload, handlers: Set }

function on(event, handler) {
	socket.on(event, handler)
}

function off(event, handler) {
	socket.off(event, handler)
}

function onThrottled(event, handler, ms = 1000) {
	// ensure entry
	let entry = throttles.get(event)
	if (!entry) {
		entry = { ms, timer: null, lastPayload: null, handlers: new Set() }
		throttles.set(event, entry)

		// low-frequency tick to flush last payload
		const tick = () => {
			const e = throttles.get(event)
			if (!e) return
			if (e.lastPayload !== null) {
				const payload = e.lastPayload
				e.lastPayload = null
				// call all handlers with last payload
				for (const h of e.handlers) {
					try { h(payload) } catch (err) { console.debug('throttled handler error', err) }
				}
			}
		}

		// listen to raw socket event and buffer last payload
		socket.on(event, (payload) => {
			const e = throttles.get(event)
			if (!e) return
			e.lastPayload = payload
		})

		entry.timer = setInterval(tick, ms)
	}

	entry.handlers.add(handler)
	return () => {
		const e = throttles.get(event)
		if (!e) return
		e.handlers.delete(handler)
		if (e.handlers.size === 0) {
			clearInterval(e.timer)
			throttles.delete(event)
			socket.off(event)
		}
	}
}

export default socket
export { on, off, onThrottled }
