import { Grid, Typography, Stack, CircularProgress, IconButton, Tooltip, Box, Paper, Card, CardHeader, CardContent, Chip, Select, MenuItem, FormControl, InputLabel, Avatar, Divider, alpha, Container } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { North, South, Refresh, Close, TrendingUp, TrendingDown, SwapVert, Router, Public } from '@mui/icons-material'
import { SparklineSource } from './custom-elements/SparklineSource'
import { GaugeFlow } from './custom-elements/GaugeFlow'
import { useEffect, useState, useRef } from 'react'
import { onThrottled } from '../socketClient'
import { LineChart } from '@mui/x-charts'

export default function IPViewPage() {
    const [destRows, setDestRows] = useState([])
    const [srcRows, setSrcRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [bandwidthData, setBandwidthData] = useState([])

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
            console.error('Error loading top sources:', err)
        } finally {
            setLoading(false)
        }
    }

    async function loadBandwidthData() {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60 * 24) // last 24h

            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/bandwidth-over-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: { from: from.toISOString(), to: to.toISOString() },
                    interval: '5m'
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setBandwidthData(data)
            }
        } catch (err) {
            console.error('Error loading bandwidth data:', err)
        }
    }

    useEffect(() => {
        loadTop()
        loadBandwidthData()

        const unsubscribe = onThrottled((data) => {
            if (data && typeof data === 'object') {
                if (data.event === 'elastic_update') {
                    loadTop()
                    loadBandwidthData()
                }
            }
        }, 5000)

        return () => unsubscribe?.()
    }, [])

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: 'background.default',
            pt: 2,
            pb: 4
        }}>
            {/* Header */}
            <Box sx={{
                px: 3,
                mb: 3
            }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Analyse des IP
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Source et destination des flux réseau avec bande passante
                </Typography>
            </Box>

            <Container maxWidth={false} sx={{ px: 3 }}>
                <Grid container spacing={3} sx={{ width: '100%' }}>
                    {/* Left Column: Tables */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Source IPs Table */}
                        <Card sx={{
                            height: '100%',
                            minHeight: 400,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <CardHeader
                                avatar={<Router sx={{ color: 'secondary.main' }} />}
                                title="IPs Sources"
                                subheader="Top 12 dernière heure"
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading}>
                                        <Refresh />
                                    </IconButton>
                                }
                            />
                            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <DataGrid
                                        rows={srcRows}
                                        columns={sourceColumn}
                                        pageSizeOptions={[5]}
                                        disableSelectionOnClick
                                        density="compact"
                                        sx={{
                                            '& .MuiDataGrid-root': { border: 'none' },
                                            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(224, 224, 224, 1)' },
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Destination IPs Table */}
                        <Card sx={{
                            height: '100%',
                            minHeight: 400,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <CardHeader
                                avatar={<Public sx={{ color: 'primary.main' }} />}
                                title="IPs Destinations"
                                subheader="Top 12 dernière heure"
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading}>
                                        <Refresh />
                                    </IconButton>
                                }
                            />
                            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <DataGrid
                                        rows={destRows}
                                        columns={destinationColumn}
                                        pageSizeOptions={[5]}
                                        disableSelectionOnClick
                                        density="compact"
                                        sx={{
                                            '& .MuiDataGrid-root': { border: 'none' },
                                            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(224, 224, 224, 1)' },
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column: Bandwidth Chart */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Card sx={{
                            width: '100%',
                            height: '100%',
                            minHeight: 850,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <CardHeader
                                avatar={<TrendingUp sx={{ color: 'success.main' }} />}
                                title="Bande Passante"
                                subheader="Dernières 24 heures"
                                action={
                                    <IconButton size="small" onClick={loadBandwidthData} disabled={loading}>
                                        <Refresh />
                                    </IconButton>
                                }
                            />
                            <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {loading || bandwidthData.length === 0 ? (
                                    <CircularProgress />
                                ) : (
                                    <LineChart
                                        width={400}
                                        height={Math.max(400, window.innerHeight - 500)}
                                        series={[
                                            {
                                                data: bandwidthData.map(d => d.bytes || 0),
                                                label: 'Bytes (Mbps)',
                                            },
                                        ]}
                                        xAxis={[{ scaleType: 'point', data: bandwidthData.map((d, i) => `${i}h`) }]}
                                        sx={{
                                            '& .MuiLineElement-root': { strokeWidth: 2 },
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}
