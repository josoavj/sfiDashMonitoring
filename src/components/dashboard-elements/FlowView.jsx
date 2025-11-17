import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState, useRef } from 'react'
import { Box, Grid, Card, CardHeader, CardContent, Avatar, Typography, Stack, Chip, alpha, Divider, IconButton, Tooltip } from '@mui/material'
import { LineChart } from '@mui/x-charts'
import { onThrottled } from '../../socketClient'
import { Cloud, TrendingUp, Refresh } from '@mui/icons-material'

export function FlowView() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [chartLabels, setChartLabels] = useState([])
    const [chartData, setChartData] = useState([])
    const chartRef = useRef({ counts: [], labels: [] })
    const [chartWindow, setChartWindow] = useState(60)

    const columns = [
        { 
            field: 'timespan', 
            headerName: 'DATE & HEURE', 
            flex: 1.8,
            minWidth: 200,
            renderCell: (params) => {
                const date = new Date(params.value)
                const formattedDate = date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                })
                const formattedTime = date.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                })
                return (
                    <Stack spacing={0.2}>
                        <Typography variant="body2" fontWeight={500}>{formattedDate}</Typography>
                        <Typography variant="caption" color="text.secondary">{formattedTime}</Typography>
                    </Stack>
                )
            }
        },
        { 
            field: 'ipsource', 
            headerName: 'IP SOURCE', 
            flex: 1.8,
            minWidth: 180,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, bgcolor: alpha('#52B57D', 0.2), fontSize: 10 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#52B57D' }}>S</Typography>
                    </Avatar>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>{params.value}</Typography>
                </Stack>
            )
        },
        { 
            field: 'source_port', 
            headerName: 'P.SRC', 
            flex: 1.2,
            minWidth: 140,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#52B57D', 0.15), 
                        color: '#52B57D',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '18px'
                    }} 
                />
            )
        },
        { 
            field: 'ipdestination', 
            headerName: 'IP DEST', 
            flex: 1.8,
            minWidth: 180,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, bgcolor: alpha('#29BAE2', 0.2), fontSize: 10 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#29BAE2' }}>D</Typography>
                    </Avatar>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>{params.value}</Typography>
                </Stack>
            )
        },
        { 
            field: 'dest_port', 
            headerName: 'P.DST', 
            flex: 1.2,
            minWidth: 140,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#29BAE2', 0.15), 
                        color: '#29BAE2',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '18px'
                    }} 
                />
            )
        },
        { 
            field: 'service', 
            headerName: 'SERVICE', 
            flex: 1.5,
            minWidth: 160,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#F4A460', 0.15), 
                        color: '#F4A460',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '18px'
                    }} 
                />
            )
        },
        { 
            field: 'protocol', 
            headerName: 'PROTO', 
            flex: 1.2,
            minWidth: 140,
            renderCell: (params) => (
                <Chip 
                    label={params.value.toUpperCase()} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#E05B5B', 0.15), 
                        color: '#E05B5B',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '18px'
                    }} 
                />
            )
        },
        { 
            field: 'direction', 
            headerName: 'DIR', 
            flex: 1.0,
            minWidth: 120,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: params.value === 'inbound' ? alpha('#52B57D', 0.15) : alpha('#F4A460', 0.15), 
                        color: params.value === 'inbound' ? '#52B57D' : '#F4A460',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '18px'
                    }} 
                />
            )
        },
    ]

    async function loadFlows() {
        setLoading(true)
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60) // last 1h
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/search', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '*', size: 50, timeRange: { from: from.toISOString(), to: to.toISOString() } }),
            })
            const data = await res.json()
            if (res.ok) {
                const hits = data.hits || []
                const mapped = hits.map((h, i) => ({ 
                    id: i + 1, 
                    timespan: h._source?.['@timestamp'] || '', 
                    ipsource: h._source?.source?.ip || h._source?.client?.ip || '-', 
                    source_port: h._source?.source?.port || h._source?.client?.port || '-',
                    ipdestination: h._source?.destination?.ip || h._source?.host?.ip || '-', 
                    dest_port: h._source?.destination?.port || h._source?.host?.port || '-',
                    service: h._source?.network?.application || h._source?.service?.name || h._source?.process?.name || '-',
                    protocol: h._source?.network?.protocol || h._source?.network?.type || '-', 
                    direction: h._source?.event?.direction || '-' 
                }))
                setRows(mapped)
                
                // Initialize chart with count
                const now = new Date()
                const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
                chartRef.current = { counts: [hits.length], labels: [label] }
                setChartLabels([label])
                setChartData([{ data: [hits.length], label: 'Logs collectés', color: '#29BAE2', area: true }])
            }
        } catch (err) {
            console.error('loadFlows', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadFlows() }, [])

    useEffect(() => {
        const handler = (payload) => {
            try {
                // payload expected to contain an array of hits or logs
                const hits = Array.isArray(payload) ? payload : (payload?.hits || payload?.logs || [])
                if (!hits.length) return
                const mapped = hits.map((h, i) => ({ 
                    id: Date.now() + i, 
                    timespan: h['@timestamp'] || h._source?.['@timestamp'] || '', 
                    ipsource: h._source?.source?.ip || h._source?.client?.ip || h.source?.ip || '-', 
                    source_port: h._source?.source?.port || h._source?.client?.port || h.source?.port || '-',
                    ipdestination: h._source?.destination?.ip || h._source?.host?.ip || h.destination?.ip || '-', 
                    dest_port: h._source?.destination?.port || h._source?.host?.port || h.destination?.port || '-',
                    service: h._source?.network?.application || h._source?.service?.name || h._source?.process?.name || h.network?.application || h.service?.name || h.process?.name || '-',
                    protocol: h._source?.network?.protocol || h._source?.network?.type || h.network?.protocol || '-', 
                    direction: h._source?.event?.direction || '-' 
                }))
                setRows((prev) => {
                    const next = [...mapped, ...prev].slice(0, 200)
                    return next
                })
                
                // Update chart with new count
                const now = new Date()
                const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
                chartRef.current.counts.push(hits.length)
                chartRef.current.labels.push(label)
                if (chartRef.current.counts.length > chartWindow) {
                    chartRef.current.counts.shift()
                    chartRef.current.labels.shift()
                }
                setChartLabels([...chartRef.current.labels])
                setChartData([{ data: [...chartRef.current.counts], label: 'Logs collectés', color: '#29BAE2', area: true }])
            } catch (err) {
                console.debug('FlowView socket handler', err)
            }
        }

        const unsubscribe = onThrottled('new-logs', handler, 1000)
        return () => { if (typeof unsubscribe === 'function') unsubscribe() }
    }, [])

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Grid container spacing={3} sx={{ width: '100%', height: '100%' }}>
                {/* Flows Table - Full width */}
                <Grid item xs={12} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card 
                        variant="outlined"
                        sx={{ 
                            height: '100%',
                            minHeight: 'calc(100vh - 130px)',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <CardHeader 
                            avatar={
                                <Avatar sx={{ bgcolor: alpha('#52B57D', 0.15), color: '#52B57D' }}>
                                    <Cloud />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>Flux réseau</Typography>}
                            subheader={`${rows.length} flux affichés (max 200)`}
                            action={
                                <Tooltip title="Actualiser">
                                    <IconButton size="small" onClick={loadFlows} disabled={loading} sx={{ bgcolor: alpha('#52B57D', 0.1) }}>
                                        <Refresh sx={{ color: '#52B57D', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{ pb: 1, '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }, flexShrink: 0 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ flex: 1, overflow: 'auto' }}>
                                <DataGrid 
                                    columns={columns} 
                                    rows={rows} 
                                    hideFooter 
                                    rowHeight={48}
                                    disableColumnResize 
                                    columnHeaderHeight={40}
                                    sx={{ 
                                        height: '100%',
                                        border: 'none',
                                        '& .MuiDataGrid-root': {
                                            fontSize: '0.8rem'
                                        },
                                        '& .MuiDataGrid-columnHeader': { 
                                            bgcolor: alpha('#29BAE2', 0.05),
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            whiteSpace: 'normal',
                                            lineHeight: '1.2'
                                        }, 
                                        '& .MuiDataGrid-row': { 
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: alpha('#29BAE2', 0.05) },
                                            '&.Mui-selected': { bgcolor: alpha('#29BAE2', 0.1) }
                                        },
                                        '& .MuiDataGrid-cell': {
                                            fontSize: '0.75rem',
                                            padding: '4px 8px'
                                        }
                                    }} 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
