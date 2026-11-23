import { useEffect, useState } from 'react'
import { LineChart } from '@mui/x-charts'
import { onThrottled } from '../../socketClient'
import { authFetch } from '../../utils/authFetch'
import { Box, Typography, useMediaQuery, useTheme, Alert, Button, Stack } from '@mui/material'
import ChartLoadingSkeleton from '../common/ChartLoadingSkeleton'

function formatTime(ts) {
    try {
        const d = new Date(ts)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch (err) {
        return '-'
    }
}

export function ChartView() {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))

    const [labels, setLabels] = useState([])
    const [series, setSeries] = useState([])
    const [loading, setLoading] = useState(false)
    const [chartError, setChartError] = useState(null)

    const chartHeight = isMobile ? 220 : isTablet ? 320 : 520

    async function load() {
        setLoading(true)
        setChartError(null)
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60) // last 1 hour
            const res = await authFetch('/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, fields: [] }),
            })
            const data = await res.json()
            if (res.ok) {
                const timeline = data.timeline || []
                const x = timeline.map((b) => formatTime(b.key))
                const counts = timeline.map((b) => b.doc_count || b.count || 0)
                setLabels(x)
                setSeries([{ data: counts, label: 'Logs', color: '#29BAE2', area: true }])
            } else {
                console.error('ChartView load error', data)
                setChartError('Impossible de charger les données du graphe.')
            }
        } catch (err) {
            console.error('ChartView exception', err)
            setChartError('Impossible de charger les données du graphe.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()

        const handler = (pt) => {
            try {
                const ts = pt.timestamp || pt.time || pt.t || Date.now()
                const label = formatTime(ts)
                setLabels((prev) => {
                    const next = [...prev.slice(-59), label]
                    return next
                })

                setSeries((prev) => {
                    const value = Math.round(((pt.totalBytes || pt.total || pt.bytes || 0) / 1024 / 1024) * 100) / 100
                    const existing = prev[0]?.data || []
                    const nextData = [...existing.slice(-59), value]
                    return [{ data: nextData, label: 'Bandwidth MB', color: '#29BAE2', area: true }]
                })
                setChartError(null)
            } catch (err) {
                console.debug('chart realtime append error', err)
            }
        }

    const unsubscribe = onThrottled('bandwidth', handler, 1000)
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
    }, [])

    return (
        <Box sx={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(41, 186, 226, 0.05)', borderRadius: 2, px: 2 }}>
            {!labels.length && loading ? (
                <ChartLoadingSkeleton height={chartHeight} chartType="line" />
            ) : null}
            {!labels.length && !loading && chartError ? (
                <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 520 }}>
                    <Alert severity="error">{chartError}</Alert>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button variant="outlined" onClick={load}>Réessayer</Button>
                    </Box>
                </Stack>
            ) : null}
            {!labels.length && !loading && !chartError ? (
                <Typography color="text.secondary">Aucune donnée à afficher pour le moment</Typography>
            ) : null}
            {labels.length ? (
                <LineChart
                    xAxis={[{ scaleType: 'point', data: labels, showMark: false }]}
                    series={series}
                    grid={{ vertical: true, horizontal: true }}
                    margin={{ left: 0, bottom: 0 }}
                    height={chartHeight}
                    sx={{ width: '100%', '& .MuiAreaElement-root': { fill: 'url(#Gradient)' }, '& .MuiLineElement-root': { strokeWidth: 4 } }}
                    slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'top', horizontal: 'start' } } }}>
                    <linearGradient id="Gradient" x1="0%" y1="120%" x2="0%" y2="0%">
                        <stop offset="0" stopColor="#FFFFFF77" />
                        <stop offset="1" stopColor="#29BAE277" />
                    </linearGradient>
                </LineChart>
            ) : null}
        </Box>
    )
}
