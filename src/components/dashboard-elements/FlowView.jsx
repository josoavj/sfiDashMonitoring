import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState, useRef } from 'react'
import { Box, Grid, Card, CardHeader, CardContent, Avatar, Typography, Stack, Chip, alpha, Divider } from '@mui/material'
import { LineChart } from '@mui/x-charts'
import { onThrottled } from '../../socketClient'
import { Cloud, TrendingUp } from '@mui/icons-material'

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
            flex: 0.9,
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
            flex: 0.65,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#52B57D', 0.2), fontSize: 12 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#52B57D' }}>S</Typography>
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
                </Stack>
            )
        },
        { 
            field: 'source_port', 
            headerName: 'PORT SOURCE', 
            flex: 0.5,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#52B57D', 0.15), 
                        color: '#52B57D',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        },
        { 
            field: 'ipdestination', 
            headerName: 'IP DESTINATION', 
            flex: 0.65,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#29BAE2', 0.2), fontSize: 12 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#29BAE2' }}>D</Typography>
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
                </Stack>
            )
        },
        { 
            field: 'dest_port', 
            headerName: 'PORT DEST', 
            flex: 0.5,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#29BAE2', 0.15), 
                        color: '#29BAE2',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        },
        { 
            field: 'service', 
            headerName: 'SERVICE', 
            flex: 0.6,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#F4A460', 0.15), 
                        color: '#F4A460',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        },
        { 
            field: 'protocol', 
            headerName: 'PROTOCOLE', 
            flex: 0.55,
            renderCell: (params) => (
                <Chip 
                    label={params.value.toUpperCase()} 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha('#E05B5B', 0.15), 
                        color: '#E05B5B',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }} 
                />
            )
        },
        { 
            field: 'direction', 
            headerName: 'DIRECTION', 
            flex: 0.5,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    sx={{ 
                        bgcolor: params.value === 'inbound' ? alpha('#52B57D', 0.15) : alpha('#F4A460', 0.15), 
                        color: params.value === 'inbound' ? '#52B57D' : '#F4A460',
                        fontWeight: 600,
                        fontSize: '0.75rem'
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
        <Box sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ width: '100%' }}>
                {/* Logs Chart */}
                <Grid item xs={12}>
                    <Card 
                        variant="outlined"
                        sx={{ 
                            height: '100%',
                            minHeight: '350px',
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
                                    <TrendingUp />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>Collecte des logs</Typography>}
                            subheader="Nombre de logs collectés en temps réel"
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 2 }}>
                            {chartLabels.length > 0 ? (
                                <LineChart 
                                    xAxis={[{ data: chartLabels, scaleType: 'point' }]}
                                    series={chartData}
                                    margin={{ top: 10, bottom: 40, left: 60, right: 10 }}
                                    height={280}
                                    slotProps={{
                                        legend: { hidden: false },
                                    }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 10 }}>
                                    En attente de données...
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Flows Table */}
                <Grid item xs={12}>
                    <Card 
                        variant="outlined"
                        sx={{ 
                            height: '100%',
                            minHeight: '500px',
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
                                    <Cloud />
                                </Avatar>
                            }
                            title={<Typography variant="h6" fontWeight={600}>Flux réseau</Typography>}
                            subheader={`${rows.length} flux affichés (max 200)`}
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ height: '100%', minHeight: '450px' }}>
                                <DataGrid 
                                    columns={columns} 
                                    rows={rows} 
                                    hideFooter 
                                    rowHeight={52}
                                    disableColumnResize 
                                    sx={{ 
                                        height: '100%',
                                        border: 'none',
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
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
