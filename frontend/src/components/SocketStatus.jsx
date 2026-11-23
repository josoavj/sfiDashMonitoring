import { useEffect, useState } from 'react'
import { Box, Typography, Avatar } from '@mui/material'
import socket from '../socketClient'

export default function SocketStatus() {
    const [connected, setConnected] = useState(socket.connected)

    useEffect(() => {
        const onConnect = () => setConnected(true)
        const onDisconnect = () => setConnected(false)
        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
        }
    }, [])

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 12, height: 12, bgcolor: connected ? '#4caf50' : '#f44336' }} />
            <Typography variant="body2" color="text.secondary">{connected ? 'Socket: connecté' : 'Socket: déconnecté'}</Typography>
        </Box>
    )
}
