import { useEffect, useState, useRef } from 'react'
import { Box, Typography, Dialog, DialogTitle, DialogContent, Button, CircularProgress, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Paper, Chip, Stack, Divider, Grid, alpha } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WifiIcon from '@mui/icons-material/Wifi'
import RouterIcon from '@mui/icons-material/Router'
import StorageIcon from '@mui/icons-material/Storage'
import { LineChart } from '@mui/x-charts'
import { io } from 'socket.io-client'

// Fonctions utilitaires
function formatTime(ts) {
    try {
        const d = new Date(ts)
        if (Number.isNaN(d.getTime())) return '-'
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (err) {
        return '-'
    }
}

export default BandwidthView

function toMB(bytes) {
    return bytes / 1024 / 1024
}

function BandwidthView() {
    const [timeline, setTimeline] = useState([])
    const [total, setTotal] = useState(0)
    const [topSources, setTopSources] = useState([])
    const [topProtocols, setTopProtocols] = useState([])
    const [topApplications, setTopApplications] = useState([])
    const socketRef = useRef(null)
    const [refreshLoading, setRefreshLoading] = useState(false)
    const [topLoading, setTopLoading] = useState(false)
    const [protocolsLoading, setProtocolsLoading] = useState(false)
    const [samplesOpen, setSamplesOpen] = useState(false)
    const [samplesLoading, setSamplesLoading] = useState(false)
    const [selectedIp, setSelectedIp] = useState(null)
    const [sampleHits, setSampleHits] = useState([])
    const [sampleSize, setSampleSize] = useState(10)
    const [ipBandwidth, setIpBandwidth] = useState(null)

    async function fetchBandwidth() {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 5)
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, interval: '15s' })
            })
            const data = await res.json()
            if (res.ok) {
                const bucketSeconds = 15
                const points = (data.timeline || []).map((b) => ({
                    t: b.key,
                    total: b.total_bytes?.value || 0,
                    sent: b.sent_bytes?.value || 0,
                    received: b.received_bytes?.value || 0,
                    rateMBs: ((b.total_bytes?.value || 0) / bucketSeconds) / 1024 / 1024
                }))
                setTimeline(points)
                setTotal(data.total || 0)
            }
        } catch (err) {
            console.error('fetchBandwidth', err)
        }
    }

    async function fetchTopSources() {
        setTopLoading(true)
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 5)
            const topRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-bandwidth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 10, type: 'source' })
            })
            const topData = await topRes.json()
            if (topRes.ok) {
                const top = (topData || []).map((b) => ({
                    ip: b.key,
                    bytes: b.total_bytes?.value || (b.total_bytes || 0),
                    count: b.connection_count?.value || b.doc_count || 0,
                    mb: (b.total_bytes?.value || (b.total_bytes || 0)) / 1024 / 1024
                }))
                setTopSources(top)
            }
        } catch (err) {
            console.error('fetchTopSources', err)
        } finally {
            setTopLoading(false)
        }
    }

    async function fetchProtocols() {
        setProtocolsLoading(true)
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 5)
            const protoRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/protocols', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 10 })
            })
            const protoData = await protoRes.json()
            if (protoRes.ok) {
                const protocols = (protoData.protocols || []).map(p => ({
                    protocol: p.key,
                    bytes: p.bytes?.value || 0,
                    count: p.doc_count || 0,
                    mb: (p.bytes?.value || 0) / 1024 / 1024
                }))
                const apps = (protoData.applications || protoData.ports || []).map(a => ({
                    name: a.key || a.name,
                    bytes: a.bytes?.value || (a.bytes || 0),
                    count: a.doc_count || 0,
                    mb: (a.bytes?.value || (a.bytes || 0)) / 1024 / 1024
                }))
                setTopProtocols(protocols)
                setTopApplications(apps)
            }
        } catch (err) {
            console.error('fetchProtocols', err)
        } finally {
            setProtocolsLoading(false)
        }
    }

    useEffect(() => {
        fetchBandwidth()
        fetchTopSources()
        fetchProtocols()

        const socketUrl = import.meta.env.VITE_BACKEND_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001'
        console.log('[BandwidthView] Tentative de connexion WebSocket:', socketUrl)
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Socket connected', socket.id)
        })

        socket.on('bandwidth', (payload) => {
            try {
                const ts = new Date(payload.timestamp).getTime()
                const intervalS = (payload.intervalMs || 2000) / 1000
                const totalBytes = payload.totalBytes || payload.bytes || 0
                const point = {
                    t: ts,
                    total: totalBytes,
                    sent: payload.sentBytes || 0,
                    received: payload.receivedBytes || 0,
                    rateMBs: (totalBytes / intervalS) / 1024 / 1024
                }
                setTimeline((prev) => {
                    const next = [...prev, point]
                    return next.slice(-300)
                })
                setTotal((prev) => (prev || 0) + (point.total || 0))
            } catch (err) {
                console.error('Error handling bandwidth socket event', err)
            }
        })

        socket.on('top-bandwidth', (payload) => {
            try {
                const intervalS = (payload.intervalMs || 2000) / 1000
                const top = (payload.top || []).map((p) => ({
                    ip: p.ip,
                    bytes: p.bytes,
                    count: p.count,
                    mb: p.bytes / 1024 / 1024,
                    mbs: (p.bytes / intervalS) / 1024 / 1024
                }))
                const protocols = (payload.topProtocols || []).map((p) => ({
                    protocol: p.protocol,
                    bytes: p.bytes,
                    count: p.count,
                    mb: p.bytes / 1024 / 1024
                }))
                const apps = (payload.topApplications || []).map((p) => ({
                    name: p.name,
                    bytes: p.bytes,
                    count: p.count,
                    mb: p.bytes / 1024 / 1024
                }))
                setTopSources(top)
                setTopProtocols(protocols)
                setTopApplications(apps)
            } catch (err) {
                console.error('Error handling top-bandwidth', err)
            }
        })

        socket.on('disconnect', () => {
            console.log('Socket disconnected')
        })

        return () => {
            if (socketRef.current) socketRef.current.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!samplesOpen && socketRef.current && selectedIp) {
            try {
                const ip = selectedIp
                socketRef.current.emit('unsubscribe-ip', { ip })
                const handler = socketRef.current.__ipHandler && socketRef.current.__ipHandler[ip]
                if (handler) {
                    socketRef.current.off('ip-bandwidth', handler)
                    delete socketRef.current.__ipHandler[ip]
                }
                setIpBandwidth(null)
            } catch (e) {
                console.error('unsubscribe-ip cleanup', e)
            }
        }
    }, [samplesOpen, selectedIp])

    async function refreshAll() {
        setRefreshLoading(true)
        try {
            await Promise.all([fetchBandwidth(), fetchTopSources(), fetchProtocols()])
        } finally {
            setRefreshLoading(false)
        }
    }

    async function loadSamples(ip, size = 10) {
        try {
            setSamplesLoading(true)
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60)
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/consumer-samples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, ip, field: 'source.ip', size })
            })
            const data = await res.json()
            if (res.ok) {
                setSampleHits(data.hits || [])
            } else {
                console.error('consumer-samples error', data)
                setSampleHits([])
            }
        } catch (err) {
            console.error('loadSamples', err)
            setSampleHits([])
        } finally {
            setSamplesLoading(false)
        }
    }

    async function openSamplesForIp(ip) {
        setSelectedIp(ip)
        setSamplesOpen(true)
        setSampleSize(10)
        await loadSamples(ip, 10)
        try {
            if (socketRef.current && socketRef.current.connected) {
                const prev = socketRef.current.__ipCurrent
                if (prev && prev !== ip) {
                    socketRef.current.emit('unsubscribe-ip', { ip: prev })
                    const prevHandler = socketRef.current.__ipHandler && socketRef.current.__ipHandler[prev]
                    if (prevHandler) socketRef.current.off('ip-bandwidth', prevHandler)
                    delete socketRef.current.__ipHandler[prev]
                }

                socketRef.current.emit('subscribe-ip', { ip })
                const handler = (payload) => {
                    try {
                        if (payload && payload.ip === ip) {
                            setIpBandwidth({
                                bytes: payload.bytes,
                                count: payload.count,
                                timestamp: payload.timestamp,
                                intervalMs: payload.intervalMs
                            })
                        }
                    } catch (e) {
                        console.error('ip-bandwidth handler', e)
                    }
                }
                socketRef.current.__ipHandler = socketRef.current.__ipHandler || {}
                socketRef.current.__ipHandler[ip] = handler
                socketRef.current.__ipCurrent = ip
                socketRef.current.on('ip-bandwidth', handler)
            }
        } catch (err) {
            console.error('subscribe-ip error', err)
        }
    }

    async function seeMoreSamples() {
        const nextSize = (sampleSize || 10) + 5
        setSampleSize(nextSize)
        await loadSamples(selectedIp, nextSize)
    }

    const xData = timeline.map((p) => formatTime(p.t))
    const totalSeries = timeline.map((p) => Number((p.rateMBs || (toMB(p.total) / 1)).toFixed(3)))
    const sentSeries = timeline.map((p) => Number(((p.sent || 0) / 1024 / 1024).toFixed(3)))
    const recvSeries = timeline.map((p) => Number(((p.received || 0) / 1024 / 1024).toFixed(3)))
    const totalMB = Number(toMB(total).toFixed(2))

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header avec stats */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)', color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TrendingUpIcon sx={{ fontSize: 40, color: 'white' }} />
                        <Box>
                            <Typography fontSize={24} fontWeight={700} color="white">
                                Bande Passante
                            </Typography>
                            <Typography fontSize={14} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                Surveillance réseau en temps réel
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="Actualiser tout">
                            <IconButton
                                size="large"
                                onClick={refreshAll}
                                disabled={refreshLoading}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                <RefreshIcon className={refreshLoading ? 'rotate-animation' : ''} />
                            </IconButton>
                        </Tooltip>
                        <Paper elevation={3} sx={{ px: 3, py: 1.5, bgcolor: 'white' }}>
                            <Typography fontSize={12} color="text.secondary">Total (5 min)</Typography>
                            <Typography fontSize={20} fontWeight={700} sx={{ color: '#02647E' }}>
                                {totalMB.toLocaleString()} MB
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            </Paper>

            {/* Graphique */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography fontSize={18} fontWeight={600} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ color: '#02647E' }} />
                    Graphique de débit
                </Typography>
                <LineChart
                    xAxis={[{ scaleType: 'point', data: xData, showMark: false }]}
                    series={[
                        { data: totalSeries, label: 'Débit (MB/s)', color: '#02647E', area: true },
                        { data: sentSeries, label: 'Envoyé (MB)', color: '#29BBE2' },
                        { data: recvSeries, label: 'Reçu (MB)', color: '#52B57D' }
                    ]}
                    grid={{ vertical: true, horizontal: true }}
                    height={400}
                    margin={{ left: 60, bottom: 40 }}
                    slotProps={{ legend: { position: { vertical: 'top', horizontal: 'right' } } }}
                />
            </Paper>

            {/* Grid layout pour Top sources et détails */}
            <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
                {/* Top sources - Pleine largeur en petit écran, 2/3 en grand écran */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontSize={18} fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WifiIcon sx={{ color: '#52B57D' }} />
                                Top Sources IP
                                <Chip label="Temps réel" size="small" sx={{ bgcolor: alpha('#52B57D', 0.2), color: '#52B57D', ml: 1 }} />
                            </Typography>
                            {topLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={fetchTopSources}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        <Stack spacing={1.5}>
                            {topSources.length === 0 && (
                                <Typography color="text.secondary" textAlign="center" py={2}>
                                    Aucune donnée disponible
                                </Typography>
                            )}
                            {topSources.map((s) => (
                                <Paper
                                    key={s.ip}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: alpha('#02647E', 0.02),
                                        '&:hover': {
                                            bgcolor: alpha('#02647E', 0.08),
                                            borderColor: '#02647E',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 1
                                        }
                                    }}
                                    onClick={() => openSamplesForIp(s.ip)}
                                >
                                    <Box>
                                        <Typography fontWeight={700} color="primary" sx={{ fontFamily: 'monospace' }}>
                                            {s.ip}
                                        </Typography>
                                        <Typography fontSize={12} color="text.secondary">
                                            {s.count} connexions
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography fontWeight={700} fontSize={18} sx={{ color: '#02647E' }}>
                                            {(s.mb || 0).toFixed(2)} MB
                                        </Typography>
                                        <Typography fontSize={12} sx={{ color: '#52B57D', fontWeight: 600 }}>
                                            {((s.mbs || 0)).toFixed(3)} MB/s
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Résumé rapide - 1/3 en grand écran */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={2} sx={{ height: '100%' }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#02647E', 0.05) }}>
                            <Typography fontSize={12} sx={{ color: 'text.secondary', mb: 0.5 }}>Débit Total (5 min)</Typography>
                            <Typography fontSize={28} fontWeight={700} sx={{ color: '#02647E' }}>
                                {totalMB.toLocaleString()}
                            </Typography>
                            <Typography fontSize={12} sx={{ color: 'text.secondary' }}>MB</Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#29BBE2', 0.05) }}>
                            <Typography fontSize={12} sx={{ color: 'text.secondary', mb: 0.5 }}>Top Sources</Typography>
                            <Typography fontSize={28} fontWeight={700} sx={{ color: '#29BBE2' }}>
                                {topSources.length}
                            </Typography>
                            <Typography fontSize={12} sx={{ color: 'text.secondary' }}>adresses</Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#F2C94C', 0.05) }}>
                            <Typography fontSize={12} sx={{ color: 'text.secondary', mb: 0.5 }}>Services</Typography>
                            <Typography fontSize={28} fontWeight={700} sx={{ color: '#F2C94C' }}>
                                {topProtocols.length}
                            </Typography>
                            <Typography fontSize={12} sx={{ color: 'text.secondary' }}>Protocoles</Typography>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>

            {/* Protocoles et Applications en Grid */}
            <Grid container spacing={3} sx={{ width: '100%' }}>
                {/* Protocoles */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontSize={18} fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RouterIcon sx={{ color: '#6D6D6D' }} />
                                Protocoles
                            </Typography>
                            {protocolsLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={fetchProtocols}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        <Stack spacing={1.5}>
                            {topProtocols.length === 0 && (
                                <Typography color="text.secondary" textAlign="center" py={2}>
                                    Aucune donnée
                                </Typography>
                            )}
                            {topProtocols.map((p) => (
                                <Paper
                                    key={p.protocol}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: alpha('#6D6D6D', 0.02),
                                        '&:hover': { bgcolor: alpha('#6D6D6D', 0.08) }
                                    }}
                                >
                                    <Box>
                                        <Typography fontWeight={700}>{p.protocol}</Typography>
                                        <Typography fontSize={12} color="text.secondary">
                                            {p.count} paquets
                                        </Typography>
                                    </Box>
                                    <Typography fontWeight={700} sx={{ color: '#6D6D6D' }}>
                                        {((p.mb || 0)).toFixed(2)} MB
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Applications */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontSize={18} fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StorageIcon sx={{ color: '#F2C94C' }} />
                                Applications
                            </Typography>
                            {protocolsLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={fetchProtocols}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        <Stack spacing={1.5}>
                            {topApplications.length === 0 && (
                                <Typography color="text.secondary" textAlign="center" py={2}>
                                    Aucune donnée
                                </Typography>
                            )}
                            {topApplications.map((a) => (
                                <Paper
                                    key={a.name}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: alpha('#F2C94C', 0.02),
                                        '&:hover': { bgcolor: alpha('#F2C94C', 0.08) }
                                    }}
                                >
                                    <Box>
                                        <Typography fontWeight={700}>{a.name}</Typography>
                                        <Typography fontSize={12} color="text.secondary">
                                            {a.count} connexions
                                        </Typography>
                                    </Box>
                                    <Typography fontWeight={700} sx={{ color: '#F2C94C' }}>
                                        {((a.mb || 0)).toFixed(2)} MB
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Dialog des échantillons */}
            <Dialog open={samplesOpen} onClose={() => setSamplesOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WifiIcon />
                        <span>Échantillons pour {selectedIp}</span>
                    </Box>
                    <IconButton onClick={() => setSamplesOpen(false)} size="small" sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {samplesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 200 }}>
                            <CircularProgress size={48} />
                        </Box>
                    ) : sampleHits.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                            <Typography color="text.secondary" textAlign="center" py={4}>
                                Aucun échantillon trouvé
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {ipBandwidth && (
                                <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'success.lighter' }}>
                                    <Typography fontSize={14} fontWeight={600}>
                                        Dernière activité: {new Date(ipBandwidth.timestamp).toLocaleTimeString()}
                                    </Typography>
                                    <Typography fontSize={13} color="text.secondary">
                                        {(ipBandwidth.bytes / 1024 / 1024).toFixed(3)} MB 
                                        ({((ipBandwidth.bytes / ((ipBandwidth.intervalMs || 2000) / 1000)) / 1024 / 1024).toFixed(3)} MB/s)
                                    </Typography>
                                </Paper>
                            )}
                            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.5 } }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Destination</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Ports</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Protocole</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Application</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sampleHits.map((h, idx) => {
                                        const src = h._source?.source || {}
                                        const dst = h._source?.destination || {}
                                        const timestamp = h._source?.['@timestamp'] || h._source?._timestamp || h._id || new Date().toISOString()
                                        const proto = h._source?.network?.protocol || 'n/a'
                                        const app = h._source?.network?.application || h._source?.process?.name || (h._source?.destination?.port ? `port:${h._source.destination.port}` : 'n/a')
                                        const message = h._source?.message || ''
                                        return (
                                            <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell sx={{ fontSize: 12 }}>{new Date(timestamp).toLocaleString()}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{src.ip || src.address || 'n/a'}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{dst.ip || dst.address || 'n/a'}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{(src.port || '-')} → {(dst.port || '-')}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}><Chip label={proto} size="small" /></TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{app}</TableCell>
                                                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{message}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button variant="outlined" onClick={() => setSamplesOpen(false)}>
                                    Fermer
                                </Button>
                                <Button variant="outlined" onClick={() => loadSamples(selectedIp, sampleSize)} startIcon={<RefreshIcon />}>
                                    Actualiser
                                </Button>
                                <Button variant="contained" onClick={seeMoreSamples}>
                                    Voir plus
                                </Button>
                            </Box>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotate-animation {
                    animation: rotate 1s linear infinite;
                }
            `}</style>
        </Box>
    )
}