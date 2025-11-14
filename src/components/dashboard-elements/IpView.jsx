import { Grid, Typography, Stack, CircularProgress, IconButton, Tooltip, Box, Paper } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { North, South, Refresh } from '@mui/icons-material'
import { SparklineSource } from '../custom-elements/SparklineSource'
import { GaugeFlow } from '../custom-elements/GaugeFlow'
import { useEffect, useState, useRef } from 'react'
import { onThrottled } from '../../socketClient'
import { LineChart } from '@mui/x-charts'

export function IpView() {
    const [destRows, setDestRows] = useState([])
    const [srcRows, setSrcRows] = useState([])
    const [loading, setLoading] = useState(false)

    const destinationColumn = [{ field: 'dest_netflow', headerName: 'IP destination (Netflow)', flex: 0.8 }, { field: 'dest_passage_number', headerName: 'Nombre de passage', flex: 0.8 }]

    const sourceColumn = [{ field: 'source_netflow', headerName: 'IP source (Netflow)', flex: 0.8 }, { field: 'source_passage_number', headerName: 'Nombre de passage', flex: 0.8 }]

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
        const handler = (payload) => {
            try {
                if (payload?.top) {
                    const rows = (payload.top || []).map((b, i) => ({ id: i + 1, source_netflow: b.ip || b.key || b._key || '-', source_passage_number: b.count || b.doc_count || b.value || 0 }))
                    setSrcRows(rows)
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

    const makeIcon = (IconComp) => <IconComp sx={{ fontSize: 20, color: 'primary.light' }} />

    // Bandwidth chart states
    const [bwLabels, setBwLabels] = useState([])
    const [bwSeries, setBwSeries] = useState([])
    const bwRef = useRef({ sent: [], recv: [], total: [] })
    const WINDOW = 60
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
                const sent = timeline.map((b) => Math.round(((b.sentBytes || 0) / 1024 / 1024) * 100) / 100)
                const recv = timeline.map((b) => Math.round(((b.receivedBytes || 0) / 1024 / 1024) * 100) / 100)
                const total = timeline.map((b) => Math.round(((b.totalBytes || 0) / 1024 / 1024) * 100) / 100)
                bwRef.current = { sent: sent.slice(-WINDOW), recv: recv.slice(-WINDOW), total: total.slice(-WINDOW) }
                setBwLabels(labels.slice(-WINDOW))
                setBwSeries([
                    { data: bwRef.current.sent, label: 'Envoyé MB/s', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv, label: 'Reçu MB/s', color: '#52B57D', area: true },
                    { data: bwRef.current.total, label: 'Débit MB/s', color: '#29BAE2', area: true },
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
                const sent = timeline.map((b) => Math.round(((b.sent_bytes?.value || 0) / 1024 / 1024) * 100) / 100)
                const recv = timeline.map((b) => Math.round(((b.received_bytes?.value || 0) / 1024 / 1024) * 100) / 100)
                const total = timeline.map((b) => Math.round(((b.total_bytes?.value || 0) / 1024 / 1024) * 100) / 100)
                bwRef.current = { sent: sent.slice(-WINDOW), recv: recv.slice(-WINDOW), total: total.slice(-WINDOW) }
                setBwLabels(labels.slice(-WINDOW))
                setBwSeries([
                    { data: bwRef.current.sent, label: 'Envoyé MB/s', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv, label: 'Reçu MB/s', color: '#52B57D', area: true },
                    { data: bwRef.current.total, label: 'Débit MB/s', color: '#29BAE2', area: true },
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

                bwRef.current.sent.push(sent); if (bwRef.current.sent.length > WINDOW) bwRef.current.sent.shift()
                bwRef.current.recv.push(recv); if (bwRef.current.recv.length > WINDOW) bwRef.current.recv.shift()
                bwRef.current.total.push(total); if (bwRef.current.total.length > WINDOW) bwRef.current.total.shift()

                setBwLabels((prev) => [...prev.slice(-WINDOW + 1), lab])
                setBwSeries([
                    { data: bwRef.current.sent.slice(-WINDOW), label: 'Envoyé MB/s', color: '#E05B5B', area: true },
                    { data: bwRef.current.recv.slice(-WINDOW), label: 'Reçu MB/s', color: '#52B57D', area: true },
                    { data: bwRef.current.total.slice(-WINDOW), label: 'Débit MB/s', color: '#29BAE2', area: true },
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
        ipPollRef.current = setInterval(() => loadBandwidthByIp(selectedIP, selectedField), 2000)
        return () => { if (ipPollRef.current) { clearInterval(ipPollRef.current); ipPollRef.current = null } }
    }, [selectedIP, selectedField])

    return (
        <Grid container spacing={1}>
            <Grid size={4} direction="column" container spacing={1}>
                <Typography fontWeight={600}>Destination</Typography>
                {loading ? <CircularProgress size={24} /> : (
                    <DataGrid columns={destinationColumn} rows={destRows} hideFooter rowHeight={41} disableColumnResize sx={{ '& .MuiDataGrid-columnHeader': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#ffffff' } }} />
                )}
            </Grid>

            <Grid size={4} direction="column" container spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={600}>Source</Typography>
                    <Tooltip title="Actualiser"><IconButton size="small" onClick={loadTop}><Refresh /></IconButton></Tooltip>
                </Box>
                {loading ? <CircularProgress size={24} /> : (
                    <DataGrid columns={sourceColumn} rows={srcRows} hideFooter rowHeight={41} disableColumnResize sx={{ '& .MuiDataGrid-columnHeader': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#ffffff' } }} />
                )}
            </Grid>

            <Grid size={4} direction="column" container spacing={1}>
                <Typography fontWeight={600}>{`Temps: ${formatted}`}</Typography>
                <Paper sx={{ p: 1, mt: 1 }} elevation={1}>
                    {bwLabels.length && bwSeries.length ? (
                        <LineChart
                            xAxis={[{ scaleType: 'point', data: bwLabels, showMark: false }]}
                            series={bwSeries}
                            grid={{ vertical: true, horizontal: true }}
                            margin={{ left: 0, bottom: 0 }}
                            height={220}
                            sx={{ '& .MuiAreaElement-root': { fill: 'url(#BWGradient)' }, '& .MuiLineElement-root': { strokeWidth: 2 } }}
                            slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'top', horizontal: 'start' } } }}>
                            <linearGradient id="BWGradient" x1="0%" y1="120%" x2="0%" y2="0%">
                                <stop offset="0" stopColor="#FFFFFF77" />
                                <stop offset="1" stopColor="#29BAE277" />
                            </linearGradient>
                        </LineChart>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Box>
                            <Typography variant="subtitle2">Envoyé</Typography>
                            <Typography fontWeight={700}>{(bwRef.current.sent.slice(-1)[0] || 0).toFixed(2)} MB/s</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Reçu</Typography>
                            <Typography fontWeight={700}>{(bwRef.current.recv.slice(-1)[0] || 0).toFixed(2)} MB/s</Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Débit</Typography>
                            <Typography fontWeight={700}>{(bwRef.current.total.slice(-1)[0] || 0).toFixed(2)} MB/s</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    )
}
