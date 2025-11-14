import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

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
