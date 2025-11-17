import { Grid, Typography, Stack, CircularProgress, IconButton, Box, Paper, Card, CardHeader, CardContent, Chip, Avatar, alpha } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Refresh, TrendingUp, Router, Public, LanOutlined } from '@mui/icons-material'
import { useEffect, useState } from 'react'
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
            p: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 10, sm: 9, md: 8 },
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

                {/* Tables Section */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {/* Source IPs Table */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            height: '100%',
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
                                title={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>IPs Sources</Typography>}
                                subheader="Top 12 dernière heure"
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading} title="Actualiser">
                                        <Refresh sx={{ fontSize: 20 }} />
                                    </IconButton>
                                }
                                sx={{ pb: 1.5 }}
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
                                        hideFooterSelectedRowCount
                                        pageSizeOptions={[5, 10, 12]}
                                        initialState={{ pagination: { paginationModel: { pageSize: 12 } } }}
                                        disableSelectionOnClick
                                        density="compact"
                                        sx={{
                                            width: '100%',
                                            border: 'none',
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
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            height: '100%',
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
                                title={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>IPs Destinations</Typography>}
                                subheader="Top 12 dernière heure"
                                action={
                                    <IconButton size="small" onClick={loadTop} disabled={loading} title="Actualiser">
                                        <Refresh sx={{ fontSize: 20 }} />
                                    </IconButton>
                                }
                                sx={{ pb: 1.5 }}
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
                                        hideFooterSelectedRowCount
                                        pageSizeOptions={[5, 10, 12]}
                                        initialState={{ pagination: { paginationModel: { pageSize: 12 } } }}
                                        disableSelectionOnClick
                                        density="compact"
                                        sx={{
                                            width: '100%',
                                            border: 'none',
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
                        title={<Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>Bande Passante</Typography>}
                        subheader="Dernières 24 heures"
                        action={
                            <IconButton size="small" onClick={loadBandwidthData} disabled={loading} title="Actualiser">
                                <Refresh sx={{ fontSize: 20 }} />
                            </IconButton>
                        }
                        sx={{ pb: 1.5 }}
                    />
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, minHeight: 400 }}>
                        {loading || bandwidthData.length === 0 ? (
                            <CircularProgress size={40} />
                        ) : (
                            <LineChart
                                width={Math.min(1200, window.innerWidth - 100)}
                                height={400}
                                series={[
                                    {
                                        data: bandwidthData.map(d => d.bytes || 0),
                                        label: 'Bande Passante (Mbps)',
                                        color: '#02647E',
                                    },
                                ]}
                                xAxis={[{ 
                                    scaleType: 'point', 
                                    data: bandwidthData.map((d, i) => `${i}h`),
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
        </Box>
    )
}

