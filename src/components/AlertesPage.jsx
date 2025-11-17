import { Box, Typography, Paper, Grid, Card, CardHeader, CardContent, Avatar, Chip, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, IconButton, Tooltip, Stack, Alert, AlertTitle } from '@mui/material'
import { TrendingUp, Warning, Refresh, SignalCellularAlt } from '@mui/icons-material'
import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { alpha } from '@mui/material/styles'

export function AlertesPage() {
    const [alerts, setAlerts] = useState([])
    const [topConsumers, setTopConsumers] = useState([])
    const [loading, setLoading] = useState(false)
    const [realtimeData, setRealtimeData] = useState({})
    const socketRef = useRef(null)

    // Charger les alertes depuis 06h30
    async function loadAlerts() {
        setLoading(true)
        try {
            const now = new Date()
            // Calculer 06h30 du matin actuel
            const from = new Date(now)
            from.setHours(6, 30, 0, 0)

            // Si on est avant 06h30, prendre hier 06h30
            if (now < from) {
                from.setDate(from.getDate() - 1)
            }

            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: now.toISOString() },
                    size: 20,
                    field: 'source.ip'
                })
            })

            const data = await res.json()
            console.log('Alerts data:', data)
            
            if (res.ok) {
                // Les données retournées sont directement un array de buckets
                const bucketsArray = Array.isArray(data) ? data : (data?.buckets ? data.buckets : [])
                
                // Convertir en alertes
                const alertsData = bucketsArray.map((item, idx) => ({
                    id: idx + 1,
                    ip: item.key,
                    totalCount: item.doc_count || 0,
                    severity: (item.doc_count || 0) > 1000 ? 'high' : (item.doc_count || 0) > 500 ? 'medium' : 'low',
                    timestamp: new Date().toISOString()
                }))
                setAlerts(alertsData)
            }
        } catch (err) {
            console.error('loadAlerts', err)
        } finally {
            setLoading(false)
        }
    }

    // Charger les top consommateurs temps réel
    async function loadTopConsumers() {
        try {
            const now = new Date()
            const from = new Date(now.getTime() - 1000 * 60 * 5) // Last 5 minutes

            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: now.toISOString() },
                    size: 5,
                    field: 'source.ip'
                })
            })

            if (!res.ok) {
                console.error('Failed to load top consumers')
                setTopConsumers([])
                return
            }

            const data = await res.json()
            const bucketsArray = Array.isArray(data) ? data : (data?.buckets ? data.buckets : [])
            
            const consumersData = bucketsArray.map((item, idx) => {
                const bytes = item.doc_count || 0
                const mb = bytes / (1024 * 1024) // Convert bytes to MB
                return {
                    id: idx + 1,
                    ip: item.key || 'Unknown',
                    bytes: bytes,
                    mb: mb,
                    percentage: 0
                }
            })
            
            // Calculer les pourcentages
            const total = consumersData.reduce((sum, c) => sum + (c.bytes || 0), 0)
            consumersData.forEach(c => {
                c.percentage = total > 0 ? Math.round((c.bytes / total) * 100) : 0
            })
            
            setTopConsumers(consumersData)
        } catch (err) {
            console.error('loadTopConsumers error:', err)
            setTopConsumers([])
        }
    }

    // Socket pour temps réel
    useEffect(() => {
        loadAlerts()
        loadTopConsumers()

        const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001'
        console.log('[AlertesPage] Tentative de connexion WebSocket:', wsUrl)
        const socket = io(wsUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling']
        })

        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Socket connected for alerts')
        })

        socket.on('bandwidth-update', (payload) => {
            try {
                // Mettre à jour données temps réel
                if (payload?.topSources) {
                    const updated = {}
                    payload.topSources.forEach(src => {
                        updated[src.ip] = src
                    })
                    setRealtimeData(prev => ({ ...prev, ...updated }))
                }
            } catch (err) {
                console.debug('bandwidth-update handler', err)
            }
        })

        return () => {
            if (socket) socket.disconnect()
        }
    }, [])

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return '#E05B5B'
            case 'medium':
                return '#F2C94C'
            case 'low':
                return '#52B57D'
            default:
                return '#6D6D6D'
        }
    }

    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'high':
                return 'Critique'
            case 'medium':
                return 'Moyen'
            case 'low':
                return 'Faible'
            default:
                return 'Info'
        }
    }

    return (
        <Box sx={{ 
          width: '100%', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 10, sm: 9, md: 8 }, 
          mt: { xs: 2, sm: 1 } 
        }}>
            <Box sx={{ maxWidth: '1800px', mx: 'auto' }}>
            {/* Header */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Warning sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Alertes
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>
                    Surveillance des IPs consommatrices et alertes temps réel
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Tooltip title="Actualiser">
                  <IconButton onClick={() => { loadAlerts(); loadTopConsumers(); }} sx={{ bgcolor: 'action.hover' }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              <Alert severity="info">
                <AlertTitle>Surveillance des alertes</AlertTitle>
                Affichage des IPs consommatrices depuis 06h30 du matin et consommation temps réel
              </Alert>
            </Box>

            <Grid container spacing={3}>
                {/* Alertes IPs Consommatrices */}
                <Grid item xs={12} lg={7}>
                    <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#E05B5B', 0.15), color: '#E05B5B' }}>
                                    <TrendingUp />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>IPs Consommatrices (Depuis 06h30)</Typography>}
                            subheader="Top 20 adresses sources"
                            action={
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={loadAlerts} disabled={loading} sx={{ bgcolor: alpha('#E05B5B', 0.1) }}>
                                        <Refresh sx={{ color: '#E05B5B', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{ pb: 1 }}
                        />
                        <CardContent sx={{ p: 2 }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : alerts.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>
                                    Aucune alerte pour le moment
                                </Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha('#E05B5B', 0.05) }}>
                                            <TableCell sx={{ fontWeight: 600 }}>IP Source</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Total (MB)</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>Sévérité</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>Temps Réel</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {alerts.map((alert) => (
                                            <TableRow key={alert.id} sx={{ '&:hover': { bgcolor: alpha('#E05B5B', 0.05) } }}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#02647E' }}>
                                                    {alert.ip}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    {alert.totalCount}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={getSeverityLabel(alert.severity)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(getSeverityColor(alert.severity), 0.15),
                                                            color: getSeverityColor(alert.severity),
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <SignalCellularAlt sx={{ fontSize: 18, color: realtimeData[alert.ip] ? '#52B57D' : '#ccc' }} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Consommateurs Temps Réel */}
                <Grid item xs={12} lg={5}>
                    <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#29BAE2', 0.15), color: '#29BAE2' }}>
                                    <SignalCellularAlt />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>Top Consommateurs Temps Réel</Typography>}
                            subheader="Dernières 5 minutes"
                            action={
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={loadTopConsumers} sx={{ bgcolor: alpha('#29BAE2', 0.1) }}>
                                        <Refresh sx={{ color: '#29BAE2' }} />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{ pb: 1 }}
                        />
                        <CardContent sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                                {topConsumers.length === 0 ? (
                                    <Typography color="text.secondary" textAlign="center" py={2}>
                                        Aucune donnée temps réel
                                    </Typography>
                                ) : (
                                    topConsumers.map((consumer, idx) => (
                                        <Paper
                                            key={consumer.id}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: alpha('#29BAE2', 0.02),
                                                borderLeft: `4px solid #29BAE2`
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                                    #{idx + 1}
                                                </Typography>
                                                <Typography fontWeight={700} sx={{ fontFamily: 'monospace', color: '#02647E' }}>
                                                    {consumer.ip}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography fontWeight={700} sx={{ color: '#29BAE2', fontSize: 18 }}>
                                                    {consumer.mb.toFixed(2)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    MB
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Stats Résumé */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#E05B5B', 0.05) }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Alertes Critiques
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#E05B5B' }}>
                                    {alerts.filter(a => a.severity === 'high').length}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#F2C94C', 0.05) }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Alertes Moyennes
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#F2C94C' }}>
                                    {alerts.filter(a => a.severity === 'medium').length}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#29BAE2', 0.05) }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Total IPs Surveillées
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#29BAE2' }}>
                                    {alerts.length}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            </Box>
        </Box>
    )
}
