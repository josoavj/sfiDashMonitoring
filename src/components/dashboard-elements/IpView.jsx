import { Grid, Typography, Stack, CircularProgress, IconButton, Tooltip, Box, Paper, Card, CardHeader, CardContent, Chip, Select, MenuItem, FormControl, InputLabel, Avatar, Divider, alpha } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { North, South, Refresh, Close, TrendingUp, TrendingDown, SwapVert, Router, Public } from '@mui/icons-material'
import { SparklineSource } from '../custom-elements/SparklineSource'
import { GaugeFlow } from '../custom-elements/GaugeFlow'
import { useEffect, useState, useRef } from 'react'
import { onThrottled } from '../../socketClient'
import { LineChart } from '@mui/x-charts'

export function IpView() {
    const [destRows, setDestRows] = useState([])
    const [srcRows, setSrcRows] = useState([])
    const [loading, setLoading] = useState(false)

    const destinationColumn = [
        { 
            field: 'dest_netflow', 
            headerName: 'IP destination', 
            flex: 1,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                        <Public sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
                </Stack>
            )
        }, 
        { 
            field: 'dest_passage_number', 
            headerName: 'Passages', 
            flex: 0.6,
            renderCell: (params) => (
                <Chip 
                    label={params.value.toLocaleString()} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#29BAE2', 0.15), 
                        color: '#29BAE2',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        }
    ]

    const sourceColumn = [
        { 
            field: 'source_netflow', 
            headerName: 'IP source', 
            flex: 1,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 12 }}>
                        <Router sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
                </Stack>
            )
        }, 
        { 
            field: 'source_passage_number', 
            headerName: 'Passages', 
            flex: 0.6,
            renderCell: (params) => (
                <Chip 
                    label={params.value.toLocaleString()} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#52B57D', 0.15), 
                        color: '#52B57D',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        }
    ]

    async function loadTop() {
        setLoading(true)
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60) // last 1h

            const destRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 12, field: 'destination.ip' }),
            })
            const destData = await destRes.json()
            if (destRes.ok) {
                const rows = (destData || []).map((b, i) => ({ id: i + 1, dest_netflow: b.key, dest_passage_number: b.doc_count || b.count || 0 }))
                setDestRows(rows)
            }

            const srcRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 12, field: 'source.ip' }),
            })
            const srcData = await srcRes.json()
            if (srcRes.ok) {
                const rows = (srcData || []).map((b, i) => ({ id: i + 1, source_netflow: b.key, source_passage_number: b.doc_count || b.count || 0 }))
                setSrcRows(rows)
            }
        } catch (err) {
            console.error('loadTop', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTop()
    }, [])

    useEffect(() => {
        const lastTopRefreshRef = { current: 0 }
        const handler = (payload) => {
            try {
                if (payload?.top) {
                    const rows = (payload.top || []).map((b, i) => ({ id: i + 1, source_netflow: b.ip || b.key || b._key || '-', source_passage_number: b.count || b.doc_count || b.value || 0 }))
                    setSrcRows(rows)
                    // refresh destination list occasionally to keep both tables realtime-ish
                    const now = Date.now()
                    if (now - (lastTopRefreshRef.current || 0) > 5000) {
                        lastTopRefreshRef.current = now
                        // reload both source and destination from API (lightweight)
                        loadTop().catch(() => {})
                    }
                }
            } catch (err) {
                console.debug('IpView socket handler', err)
            }
        }

        const unsubscribe = onThrottled('top-bandwidth', handler, 1500)
        return () => { if (typeof unsubscribe === 'function') unsubscribe() }
    }, [])

    const now = new Date()

    const formatted = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0')

    // Bandwidth chart states
    const [bwLabels, setBwLabels] = useState([])
    const [bwSeries, setBwSeries] = useState([])
    const bwRef = useRef({ sent: [], recv: [], total: [] })
    const [chartWindow, setChartWindow] = useState(60)
    const [pollMs, setPollMs] = useState(2000)
    const [selectedIP, setSelectedIP] = useState(null)
    const [selectedField, setSelectedField] = useState('source.ip')
    const ipPollRef = useRef(null)

    async function loadBandwidthHistory() {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60) // last 1h
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, interval: '1m' }),
            })
            const data = await res.json()
            if (res.ok) {
                const timeline = data.timeline || []
                const labels = timeline.map((b) => {
                    const d = new Date(b.key)
                    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                })
                const extract = (b) => {
                    return b.sentBytes ?? b.sent_bytes?.value ?? b.sent_bytes ?? b.sent_bytes?.value ?? 0
                }
                const extractRecv = (b) => {
                    return b.receivedBytes ?? b.received_bytes?.value ?? b.received_bytes ?? b.received_bytes?.value ?? 0
                }
                const extractTotal = (b) => {
                    return b.totalBytes ?? b.total_bytes?.value ?? b.total_bytes ?? b.total_bytes?.value ?? 0
                }

                const sent = timeline.map((b) => Math.round(((extract(b) || 0) / 1024 / 1024) * 100) / 100)
                const recv = timeline.map((b) => Math.round(((extractRecv(b) || 0) / 1024 / 1024) * 100) / 100)
                const total = timeline.map((b) => Math.round(((extractTotal(b) || 0) / 1024 / 1024) * 100) / 100)
                bwRef.current = { sent: sent.slice(-chartWindow), recv: recv.slice(-chartWindow), total: total.slice(-chartWindow) }
                setBwLabels(labels.slice(-chartWindow))
                setBwSeries([
                    { data: bwRef.current.sent, label: 'Envoyé', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv, label: 'Reçu', color: '#52B57D', area: true },
                    { data: bwRef.current.total, label: 'Débit', color: '#29BAE2', area: true },
                ])
            }
        } catch (err) { console.error('loadBandwidthHistory', err) }
    }

    async function loadBandwidthByIp(ip, field = 'source.ip') {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 10) // last 10m for per-ip
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth-by-ip', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, interval: '10s', ip, field }),
            })
            const data = await res.json()
            if (res.ok) {
                const timeline = data.timeline || []
                const labels = timeline.map((b) => {
                    const d = new Date(b.key)
                    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
                })
                const extract = (b) => b.sent_bytes?.value ?? b.sentBytes ?? b.sent_bytes ?? 0
                const extractRecv = (b) => b.received_bytes?.value ?? b.receivedBytes ?? b.received_bytes ?? 0
                const extractTotal = (b) => b.total_bytes?.value ?? b.totalBytes ?? b.total_bytes ?? 0

                const sent = timeline.map((b) => Math.round(((extract(b) || 0) / 1024 / 1024) * 100) / 100)
                const recv = timeline.map((b) => Math.round(((extractRecv(b) || 0) / 1024 / 1024) * 100) / 100)
                const total = timeline.map((b) => Math.round(((extractTotal(b) || 0) / 1024 / 1024) * 100) / 100)
                bwRef.current = { sent: sent.slice(-chartWindow), recv: recv.slice(-chartWindow), total: total.slice(-chartWindow) }
                setBwLabels(labels.slice(-chartWindow))
                setBwSeries([
                    { data: bwRef.current.sent, label: 'Envoyé', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv, label: 'Reçu', color: '#52B57D', area: true },
                    { data: bwRef.current.total, label: 'Débit', color: '#29BAE2', area: true },
                ])
            }
        } catch (err) { console.error('loadBandwidthByIp', err) }
    }

    useEffect(() => {
        loadBandwidthHistory()
        const handler = (pt) => {
            try {
                const ts = pt.timestamp || Date.now()
                const label = new Date(ts)
                const lab = `${String(label.getHours()).padStart(2, '0')}:${String(label.getMinutes()).padStart(2, '0')}:${String(label.getSeconds()).padStart(2, '0')}`
                const sent = Math.round(((pt.sentBytes || 0) / 1024 / 1024) * 100) / 100
                const recv = Math.round(((pt.receivedBytes || 0) / 1024 / 1024) * 100) / 100
                const total = Math.round(((pt.totalBytes || 0) / 1024 / 1024) * 100) / 100

                bwRef.current.sent.push(sent); if (bwRef.current.sent.length > chartWindow) bwRef.current.sent.shift()
                bwRef.current.recv.push(recv); if (bwRef.current.recv.length > chartWindow) bwRef.current.recv.shift()
                bwRef.current.total.push(total); if (bwRef.current.total.length > chartWindow) bwRef.current.total.shift()

                setBwLabels((prev) => [...prev.slice(-chartWindow + 1), lab])
                setBwSeries([
                    { data: bwRef.current.sent.slice(-chartWindow), label: 'Envoyé', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv.slice(-chartWindow), label: 'Reçu', color: '#52B57D', area: true },
                    { data: bwRef.current.total.slice(-chartWindow), label: 'Débit', color: '#29BAE2', area: true },
                ])
            } catch (err) { console.debug('bw handler', err) }
        }

        const unsubscribe = onThrottled('bandwidth', handler, 1000)
        return () => { if (typeof unsubscribe === 'function') unsubscribe() }
    }, [])

    // polling per-IP when selected
    useEffect(() => {
        // clear previous
        if (ipPollRef.current) { clearInterval(ipPollRef.current); ipPollRef.current = null }
        if (!selectedIP) return
        // immediate load
        loadBandwidthByIp(selectedIP, selectedField)
        ipPollRef.current = setInterval(() => loadBandwidthByIp(selectedIP, selectedField), pollMs)
        return () => { if (ipPollRef.current) { clearInterval(ipPollRef.current); ipPollRef.current = null } }
    }, [selectedIP, selectedField, pollMs, chartWindow])

    return (
        <Box sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ width: '100%' }}>
                {/* Source IPs - Full width */}
                <Grid item xs={12}>
                    <Card 
                        variant="outlined" 
                        sx={{ 
                            height: '100%',
                            minHeight: '450px',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
                        }}
                    >
                        <CardHeader 
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#52B57D', 0.15), color: '#52B57D' }}>
                                    <TrendingUp />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>IPs Source</Typography>}
                            subheader="Top 12 adresses source"
                            action={
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={loadTop} sx={{ bgcolor: alpha('#52B57D', 0.1) }}>
                                        <Refresh sx={{ color: '#52B57D' }} />
                                    </IconButton>
                                </Tooltip>
                            } 
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ flex: 1, '& .MuiDataGrid-root': { border: 'none' } }}>
                                <DataGrid 
                                    columns={sourceColumn} 
                                    rows={srcRows} 
                                    hideFooter 
                                    rowHeight={52}
                                    disableColumnResize 
                                    sx={{ 
                                        height: '100%',
                                        '& .MuiDataGrid-columnHeader': { 
                                            bgcolor: alpha('#52B57D', 0.05),
                                            fontWeight: 600,
                                            fontSize: '0.85rem'
                                        }, 
                                        '& .MuiDataGrid-row': { 
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: alpha('#52B57D', 0.05) },
                                            '&.Mui-selected': { bgcolor: alpha('#52B57D', 0.1) }
                                        } 
                                    }} 
                                    onRowClick={(params) => { 
                                        try { 
                                            setSelectedIP(params.row.source_netflow); 
                                            setSelectedField('source.ip') 
                                        } catch (e) { } 
                                    }} 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Destination IPs - Full width */}
                <Grid item xs={12}>
                    <Card 
                        variant="outlined"
                        sx={{ 
                            height: '100%',
                            minHeight: '450px',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
                        }}
                    >
                        <CardHeader 
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#29BAE2', 0.15), color: '#29BAE2' }}>
                                    <TrendingDown />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>IPs Destination</Typography>}
                            subheader="Top 12 adresses destination"
                            action={loading ? <CircularProgress size={24} sx={{ color: '#29BAE2' }} /> : null} 
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Paper 
                                sx={{ 
                                    p: 1.5, 
                                    mb: 2, 
                                    bgcolor: alpha('#29BAE2', 0.05),
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: alpha('#29BAE2', 0.2),
                                    flexShrink: 0
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SwapVert sx={{ fontSize: 16 }} />
                                    Cliquez sur une ligne pour analyser
                                </Typography>
                            </Paper>
                            <Box sx={{ flex: 1, '& .MuiDataGrid-root': { border: 'none' } }}>
                                <DataGrid 
                                    columns={destinationColumn} 
                                    rows={destRows} 
                                    hideFooter 
                                    rowHeight={52}
                                    disableColumnResize 
                                    sx={{ 
                                        height: '100%',
                                        '& .MuiDataGrid-columnHeader': { 
                                            bgcolor: alpha('#29BAE2', 0.05),
                                            fontWeight: 600,
                                            fontSize: '0.85rem'
                                        }, 
                                        '& .MuiDataGrid-row': { 
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: alpha('#29BAE2', 0.05) },
                                            '&.Mui-selected': { bgcolor: alpha('#29BAE2', 0.1) }
                                        } 
                                    }} 
                                    onRowClick={(params) => { 
                                        try { 
                                            setSelectedIP(params.row.dest_netflow); 
                                            setSelectedField('destination.ip') 
                                        } catch (e) { } 
                                    }} 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bandwidth Chart - Full Width */}
                <Grid item xs={12}>
                    <Card 
                        variant="outlined"
                        sx={{ 
                            height: '100%',
                            minHeight: '400px',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: selectedIP ? alpha('#E05B5B', 0.3) : 'divider',
                            boxShadow: selectedIP ? '0 4px 16px rgba(224,91,91,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            bgcolor: selectedIP ? alpha('#E05B5B', 0.02) : 'white'
                        }}
                    >
                        <CardHeader 
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#E05B5B', 0.15), color: '#E05B5B' }}>
                                    <SwapVert />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>Bande passante</Typography>}
                            subheader={
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{formatted}</Typography>
                                    {selectedIP && (
                                        <Chip 
                                            label={selectedIP} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: alpha('#E05B5B', 0.15), 
                                                color: '#E05B5B',
                                                fontWeight: 600,
                                                fontSize: '0.7rem'
                                            }} 
                                        />
                                    )}
                                </Stack>
                            }
                            action={selectedIP ? (
                                <Tooltip title="Effacer la sélection">
                                    <IconButton size="small" onClick={() => setSelectedIP(null)} sx={{ bgcolor: alpha('#E05B5B', 0.1) }}>
                                        <Close sx={{ fontSize: 18, color: '#E05B5B' }} />
                                    </IconButton>
                                </Tooltip>
                            ) : null} 
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>Fenêtre</InputLabel>
                                    <Select value={chartWindow} label="Fenêtre" onChange={(e) => setChartWindow(Number(e.target.value))}>
                                        <MenuItem value={30}>30 pts</MenuItem>
                                        <MenuItem value={60}>60 pts</MenuItem>
                                        <MenuItem value={120}>120 pts</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>Intervalle</InputLabel>
                                    <Select value={pollMs} label="Intervalle" onChange={(e) => setPollMs(Number(e.target.value))}>
                                        <MenuItem value={2000}>2 s</MenuItem>
                                        <MenuItem value={5000}>5 s</MenuItem>
                                        <MenuItem value={10000}>10 s</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: alpha('#f5f7fa', 0.5),
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }} 
                                elevation={0}
                            >
                                {bwLabels.length && bwSeries.length ? (
                                    <LineChart
                                        xAxis={[{ scaleType: 'point', data: bwLabels, showMark: false }]}
                                        series={bwSeries}
                                        grid={{ vertical: true, horizontal: true }}
                                        margin={{ left: 40, right: 10, top: 40, bottom: 30 }}
                                        height={340}
                                        sx={{ 
                                            '& .MuiAreaElement-root': { fillOpacity: 0.3 }, 
                                            '& .MuiLineElement-root': { strokeWidth: 2.5 } 
                                        }}
                                        slotProps={{ 
                                            legend: { 
                                                direction: 'row', 
                                                position: { vertical: 'top', horizontal: 'middle' },
                                                itemMarkWidth: 12,
                                                itemMarkHeight: 12,
                                                labelStyle: { fontSize: 12, fontWeight: 500 }
                                            } 
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 340 }}>
                                        <CircularProgress size={36} />
                                    </Box>
                                )}
                            </Paper>

                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={4}>
                                    <Paper 
                                        sx={{ 
                                            p: 1.5, 
                                            textAlign: 'center',
                                            bgcolor: alpha('#E05B5B', 0.05),
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: alpha('#E05B5B', 0.2)
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Envoyé</Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: '#E05B5B', mt: 0.5 }}>
                                            {(bwRef.current.sent.slice(-1)[0] || 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">MB/s</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                    <Paper 
                                        sx={{ 
                                            p: 1.5, 
                                            textAlign: 'center',
                                            bgcolor: alpha('#52B57D', 0.05),
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: alpha('#52B57D', 0.2)
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Reçu</Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: '#52B57D', mt: 0.5 }}>
                                            {(bwRef.current.recv.slice(-1)[0] || 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">MB/s</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                    <Paper 
                                        sx={{ 
                                            p: 1.5, 
                                            textAlign: 'center',
                                            bgcolor: alpha('#29BAE2', 0.05),
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: alpha('#29BAE2', 0.2)
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Débit</Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: '#29BAE2', mt: 0.5 }}>
                                            {(bwRef.current.total.slice(-1)[0] || 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">MB/s</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}