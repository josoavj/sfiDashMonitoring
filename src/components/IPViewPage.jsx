import { Grid, Typography, Stack, CircularProgress, IconButton, Box, Paper, Card, CardHeader, CardContent, Chip, Avatar, alpha, Button, Dialog, DialogTitle, DialogContent, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Refresh, TrendingUp, Router, Public, LanOutlined, Close, Info } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { onThrottled } from '../socketClient'
import { LineChart, BarChart } from '@mui/x-charts'

export default function IPViewPage() {
    const [destRows, setDestRows] = useState([])
    const [srcRows, setSrcRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingBandwidth, setLoadingBandwidth] = useState(false)
    const [bandwidthData, setBandwidthData] = useState([])
    const [selectedIP, setSelectedIP] = useState(null)
    const [selectedIPType, setSelectedIPType] = useState(null) // 'source' or 'dest'
    const [selectedIPBandwidth, setSelectedIPBandwidth] = useState([])
    const [selectedIPDetails, setSelectedIPDetails] = useState(null) // Additional IP info
    const [showIPDetails, setShowIPDetails] = useState(false)
    const [timeRange, setTimeRange] = useState('24h') // '4h', '6h', '24h'
    const [bandwidthTimeRange, setBandwidthTimeRange] = useState('24h') // Separate for bandwidth chart

    // Helper functions
    const getTimeRangeMs = (range) => {
        const multipliers = { '4h': 4, '6h': 6, '24h': 24 }
        return 1000 * 60 * 60 * (multipliers[range] || 24)
    }

    const getTimeRangeLabel = (range) => {
        return {
            '4h': 'Dernières 4h',
            '6h': 'Dernières 6h',
            '24h': 'Dernières 24h'
        }[range] || 'Temps réel'
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ''
        try {
            const date = new Date(timestamp)
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        } catch {
            return timestamp
        }
    }

    const formatFullTimestamp = (timestamp) => {
        if (!timestamp) return ''
        try {
            const date = new Date(timestamp)
            return date.toLocaleString('fr-FR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        } catch {
            return timestamp
        }
    }

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
            const from = new Date(to.getTime() - getTimeRangeMs(timeRange))

            const destRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 50, field: 'destination.ip' }),
            })
            const destData = await destRes.json()
            if (destRes.ok) {
                const rows = (destData || []).map((b, i) => ({ id: i + 1, dest_netflow: b.key, dest_passage_number: b.doc_count || b.count || 0, dest_bytes: b.total_bytes?.value || 0 }))
                setDestRows(rows)
            }

            const srcRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/top-sources', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 50, field: 'source.ip' }),
            })
            const srcData = await srcRes.json()
            if (srcRes.ok) {
                const rows = (srcData || []).map((b, i) => ({ id: i + 1, source_netflow: b.key, source_passage_number: b.doc_count || b.count || 0, source_bytes: b.total_bytes?.value || 0 }))
                setSrcRows(rows)
            }
        } catch (err) {
            console.error('Error loading top sources:', err)
        } finally {
            setLoading(false)
        }
    }

    async function loadBandwidthData() {
        try {
            setLoadingBandwidth(true)
            const to = new Date()
            const from = new Date(to.getTime() - getTimeRangeMs(bandwidthTimeRange))

            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: to.toISOString() },
                    interval: bandwidthTimeRange === '24h' ? '1h' : '30m'
                }),
            })
            const data = await res.json()
            if (res.ok && data.timeline) {
                // Transform timeline buckets to chart format
                const formattedData = data.timeline.map(bucket => ({
                    timestamp: bucket.key_as_string || bucket.key,
                    timestampLabel: formatTimestamp(bucket.key_as_string || bucket.key),
                    bytes: bucket.total_bytes?.value || 0,
                }))
                setBandwidthData(formattedData)
            } else {
                console.error('No timeline data:', data)
            }
        } catch (err) {
            console.error('Error loading bandwidth data:', err)
        } finally {
            setLoadingBandwidth(false)
        }
    }

    async function loadIPBandwidthData(ip, ipType) {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - getTimeRangeMs(timeRange)) // Use same timeRange as tables

            const field = ipType === 'source' ? 'source.ip' : 'destination.ip'
            const interval = timeRange === '24h' ? '1h' : timeRange === '6h' ? '15m' : '5m' // Adapt interval to time range
            
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth-by-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: to.toISOString() },
                    interval: interval,
                    ip: ip,
                    field: field
                }),
            })
            const data = await res.json()
            if (res.ok && data.timeline) {
                const formattedData = data.timeline.map(bucket => ({
                    timestamp: bucket.key_as_string || bucket.key,
                    timestampLabel: formatFullTimestamp(bucket.key_as_string || bucket.key),
                    bytes: bucket.total_bytes?.value || 0,
                    sentBytes: bucket.sent_bytes?.value || 0,
                    receivedBytes: bucket.received_bytes?.value || 0,
                }))
                setSelectedIPBandwidth(formattedData)
            }
        } catch (err) {
            console.error('Error loading IP bandwidth data:', err)
        }
    }

    async function loadIPDetails(ip, ipType) {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - getTimeRangeMs(timeRange)) // Synchro with timeRange!

            const field = ipType === 'source' ? 'source.ip' : 'destination.ip'
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/ip-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: to.toISOString() },
                    ip: ip,
                    field: field
                }),
            })
            const data = await res.json()
            if (res.ok) {
                const totalBytes = srcRows.reduce((sum, r) => sum + (r.source_bytes || 0), 0) + destRows.reduce((sum, r) => sum + (r.dest_bytes || 0), 0)
                setSelectedIPDetails({
                    ip: ip,
                    type: ipType,
                    count: data.count || 0,
                    bytes: data.total_bytes || 0,
                    avgBytes: data.avg_bytes || 0,
                    percentageOfTotal: totalBytes > 0 ? ((data.total_bytes || 0) / totalBytes) * 100 : 0,
                })
            }
        } catch (err) {
            console.error('Error loading IP details:', err)
        }
    }

    const handleRowClick = (params) => {
        const ip = params.row.source_netflow || params.row.dest_netflow
        const type = params.row.source_netflow ? 'source' : 'dest'
        setSelectedIP(ip)
        setSelectedIPType(type)
        loadIPBandwidthData(ip, type)
        loadIPDetails(ip, type)
        setShowIPDetails(true)
    }

    useEffect(() => {
        loadTop()
        loadBandwidthData()
    }, [timeRange, bandwidthTimeRange])

    useEffect(() => {
        // Reload IP details when timeRange changes and an IP is selected
        if (selectedIP && selectedIPType) {
            loadIPDetails(selectedIP, selectedIPType)
        }
    }, [timeRange])

    useEffect(() => {
        const unsubscribe = onThrottled((data) => {
            if (data && typeof data === 'object') {
                if (data.event === 'elastic_update') {
                    loadTop()
                    loadBandwidthData()
                    // Also refresh selected IP data
                    if (selectedIP && selectedIPType) {
                        loadIPBandwidthData(selectedIP, selectedIPType)
                    }
                }
            }
        }, 5000)

        return () => unsubscribe?.()
    }, [selectedIP, selectedIPType])

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
            p: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 12, sm: 11, md: 10 }, 
        }}>
            <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
                        borderRadius: 2,
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LanOutlined sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Analyse des IPs
                            </Typography>
                            <Typography sx={{ opacity: 0.9, fontSize: 14 }}>
                                Monitoring des adresses IP source et destination avec analyse de bande passante
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Time Range Selector */}
                <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#02647E' }}>
                            Plage horaire - Tableaux IPs:
                        </Typography>
                        <ToggleButtonGroup
                            value={timeRange}
                            exclusive
                            onChange={(e, newValue) => newValue && setTimeRange(newValue)}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    px: 2,
                                    py: 1,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    border: '1px solid rgba(2, 100, 126, 0.3)',
                                    color: '#02647E',
                                    '&:hover': { backgroundColor: 'rgba(2, 100, 126, 0.08)' },
                                    '&.Mui-selected': {
                                        backgroundColor: '#02647E',
                                        color: 'white',
                                        border: '1px solid #02647E',
                                        '&:hover': { backgroundColor: '#1a8fa0' }
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="4h">4 heures</ToggleButton>
                            <ToggleButton value="6h">6 heures</ToggleButton>
                            <ToggleButton value="24h">24 heures</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#02647E' }}>
                            Plage horaire - Bande Passante:
                        </Typography>
                        <ToggleButtonGroup
                            value={bandwidthTimeRange}
                            exclusive
                            onChange={(e, newValue) => newValue && setBandwidthTimeRange(newValue)}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    px: 2,
                                    py: 1,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    border: '1px solid rgba(2, 100, 126, 0.3)',
                                    color: '#02647E',
                                    '&:hover': { backgroundColor: 'rgba(2, 100, 126, 0.08)' },
                                    '&.Mui-selected': {
                                        backgroundColor: '#02647E',
                                        color: 'white',
                                        border: '1px solid #02647E',
                                        '&:hover': { backgroundColor: '#1a8fa0' }
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="4h">4 heures</ToggleButton>
                            <ToggleButton value="6h">6 heures</ToggleButton>
                            <ToggleButton value="24h">24 heures</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {/* Tables & Details Section */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    {/* Source IPs Table */}
                    <Grid item xs={12} lg={6}>
                        <Card sx={{
                            height: '100%',
                            minHeight: '600px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }
                        }}>
                            <CardHeader
                                avatar={<Router sx={{ color: 'secondary.main', fontSize: 24 }} />}
                                title={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>IPs Sources</Typography>
                                        <Chip label={getTimeRangeLabel(timeRange)} size="small" variant="outlined" sx={{ height: 24, fontSize: 11, fontWeight: 600 }} />
                                    </Box>
                                }
                                subheader={`Top 50 (${srcRows.length})`}
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading} title="Actualiser">
                                        <Refresh sx={{ fontSize: 20 }} />
                                    </IconButton>
                                }
                                sx={{ pb: 1 }}
                            />
                            <CardContent sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 0 }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', p: 3 }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : (
                                    <DataGrid
                                        rows={srcRows}
                                        columns={sourceColumn}
                                        pageSizeOptions={[10, 25, 50]}
                                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                        disableSelectionOnClick
                                        onRowClick={handleRowClick}
                                        density="compact"
                                        sx={{
                                            width: '100%',
                                            border: 'none',
                                            cursor: 'pointer',
                                            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(2, 100, 126, 0.05)' },
                                            '& .MuiDataGrid-row.Mui-selected': { backgroundColor: 'rgba(2, 100, 126, 0.15)' },
                                            '& .MuiDataGrid-root': { border: 'none' },
                                            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(224, 224, 224, 0.5)', fontSize: 13 },
                                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fafafa', fontWeight: 600, fontSize: 12, borderBottom: '2px solid rgba(0,0,0,0.08)' },
                                            '& .MuiDataGrid-virtualScroller': { overflow: 'auto' },
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Destination IPs Table */}
                    <Grid item xs={12} lg={6}>
                        <Card sx={{
                            height: '100%',
                            minHeight: '600px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }
                        }}>
                            <CardHeader
                                avatar={<Public sx={{ color: 'primary.main', fontSize: 24 }} />}
                                title={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>IPs Destinations</Typography>
                                        <Chip label={getTimeRangeLabel(timeRange)} size="small" variant="outlined" sx={{ height: 24, fontSize: 11, fontWeight: 600 }} />
                                    </Box>
                                }
                                subheader={`Top 50 (${destRows.length})`}
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading} title="Actualiser">
                                        <Refresh sx={{ fontSize: 20 }} />
                                    </IconButton>
                                }
                                sx={{ pb: 1 }}
                            />
                            <CardContent sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 0 }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', p: 3 }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : (
                                    <DataGrid
                                        rows={destRows}
                                        columns={destinationColumn}
                                        pageSizeOptions={[10, 25, 50]}
                                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                        disableSelectionOnClick
                                        onRowClick={handleRowClick}
                                        density="compact"
                                        sx={{
                                            width: '100%',
                                            border: 'none',
                                            cursor: 'pointer',
                                            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(2, 100, 126, 0.05)' },
                                            '& .MuiDataGrid-row.Mui-selected': { backgroundColor: 'rgba(2, 100, 126, 0.15)' },
                                            '& .MuiDataGrid-root': { border: 'none' },
                                            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(224, 224, 224, 0.5)', fontSize: 13 },
                                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fafafa', fontWeight: 600, fontSize: 12, borderBottom: '2px solid rgba(0,0,0,0.08)' },
                                            '& .MuiDataGrid-virtualScroller': { overflow: 'auto' },
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Bandwidth Chart Section */}
                <Card sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                    }
                }}>
                    <CardHeader
                        avatar={<TrendingUp sx={{ color: 'success.main', fontSize: 24 }} />}
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>Bande Passante</Typography>
                                <Chip label={getTimeRangeLabel(bandwidthTimeRange)} size="small" variant="outlined" sx={{ height: 24, fontSize: 11, fontWeight: 600 }} />
                            </Box>
                        }
                        subheader=""
                        action={
                            <IconButton size="small" onClick={loadBandwidthData} disabled={loadingBandwidth} title="Actualiser">
                                <Refresh sx={{ fontSize: 20 }} />
                            </IconButton>
                        }
                        sx={{ pb: 1.5 }}
                    />
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, minHeight: 400 }}>
                        {loadingBandwidth || bandwidthData.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={40} />
                                <Typography variant="body2" color="textSecondary">
                                    {bandwidthData.length === 0 && !loadingBandwidth ? 'Aucune donnée disponible' : 'Chargement...'}
                                </Typography>
                            </Box>
                        ) : (
                            <LineChart
                                width={Math.min(1200, window.innerWidth - 100)}
                                height={400}
                                series={[
                                    {
                                        data: bandwidthData.map(d => Math.round(d.bytes / (1024 * 1024)) || 0), // Convert to MB
                                        label: 'Bande Passante (MB)',
                                        color: '#02647E',
                                        curve: 'linear',
                                    },
                                ]}
                                xAxis={[{ 
                                    scaleType: 'point', 
                                    data: bandwidthData.map(d => d.timestampLabel || formatTimestamp(d.timestamp)),
                                }]}
                                margin={{ top: 10, bottom: 30, left: 60, right: 10 }}
                                slotProps={{
                                    legend: { hidden: false, position: 'top-right' }
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* IP Detail Dialog */}
            <Dialog 
                open={showIPDetails} 
                onClose={() => setShowIPDetails(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    pb: 2,
                    background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
                    color: 'white'
                }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Détails - {selectedIPType === 'source' ? 'IP Source' : 'IP Destination'}: {selectedIP}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            {getTimeRangeLabel(timeRange)} • {selectedIPType === 'source' ? 'Source' : 'Destination'}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setShowIPDetails(false)} size="small" sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 3 }}>
                        {selectedIPBandwidth.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Info Header */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(2, 100, 126, 0.08)', border: '1px solid rgba(2, 100, 126, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#02647E', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                IP Adresse
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 14, wordBreak: 'break-all' }}>
                                                {selectedIP}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(2, 100, 126, 0.08)', border: '1px solid rgba(2, 100, 126, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#02647E', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Type
                                            </Typography>
                                            <Chip 
                                                label={selectedIPType === 'source' ? 'Source' : 'Destination'} 
                                                size="small"
                                                color={selectedIPType === 'source' ? 'secondary' : 'primary'}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Passages
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {selectedIPDetails?.count.toLocaleString() || 0}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(244, 67, 54, 0.08)', border: '1px solid rgba(244, 67, 54, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#F44336', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Bande Passante
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {((selectedIPDetails?.bytes || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Stats Row */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Total Envoyé
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {(selectedIPBandwidth.reduce((sum, d) => sum + (d.sentBytes || 0), 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#2196F3', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Total Reçu
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {(selectedIPBandwidth.reduce((sum, d) => sum + (d.receivedBytes || 0), 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2.5, backgroundColor: 'rgba(156, 39, 176, 0.08)', border: '1px solid rgba(156, 39, 176, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#9C27B0', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Moyenne/{timeRange === '24h' ? '1h' : timeRange === '6h' ? '15min' : '5min'}
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {selectedIPBandwidth.length > 0 ? (selectedIPBandwidth.reduce((sum, d) => sum + (d.bytes || 0), 0) / selectedIPBandwidth.length / (1024 * 1024)).toFixed(2) : 0} MB
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Bandwidth Chart */}
                                <Card sx={{ p: 3, backgroundColor: '#fafafa', border: '1px solid rgba(0,0,0,0.08)' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#02647E' }}>
                                        Évolution - Envoyé vs Reçu ({getTimeRangeLabel(timeRange)}, intervalle {timeRange === '24h' ? '1h' : timeRange === '6h' ? '15min' : '5min'})
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 300 }}>
                                        <BarChart
                                            dataset={selectedIPBandwidth}
                                            xAxis={[{ 
                                                scaleType: 'band', 
                                                dataKey: 'timestampLabel',
                                            }]}
                                            series={[
                                                { 
                                                    dataKey: 'sentBytes', 
                                                    label: 'Envoyé',
                                                    color: '#52B57D'
                                                },
                                                { 
                                                    dataKey: 'receivedBytes', 
                                                    label: 'Reçu',
                                                    color: '#02647E'
                                                }
                                            ]}
                                            width={500}
                                            height={300}
                                            margin={{ top: 10, bottom: 40, left: 60, right: 10 }}
                                            slotProps={{
                                                legend: { hidden: false, position: 'top-right' }
                                            }}
                                        />
                                    </Box>
                                </Card>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    )
}

