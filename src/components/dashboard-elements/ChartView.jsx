import { useEffect, useState } from 'react'
import { LineChart } from '@mui/x-charts'
import socket from '../../socketClient'

function formatTime(ts) {
    try {
        const d = new Date(ts)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch (err) {
        return '-'
    }
}

export function ChartView() {
    const [labels, setLabels] = useState([])
    const [series, setSeries] = useState([])

    async function load() {
        try {
            const to = new Date()
            const from = new Date(to.getTime() - 1000 * 60 * 60) // last 1 hour
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/stats', {
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
            }
        } catch (err) {
            console.error('ChartView exception', err)
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
            } catch (err) {
                console.debug('chart realtime append error', err)
            }
        }

        socket.on('bandwidth', handler)
        return () => { socket.off('bandwidth', handler) }
    }, [])

    if (!labels.length) return null

    return (
        <LineChart
            xAxis={[{ scaleType: 'point', data: labels, showMark: false }]}
            series={series}
            grid={{ vertical: true, horizontal: true }}
            margin={{ left: 0, bottom: 0 }}
            height={520}
            sx={{ '& .MuiAreaElement-root': { fill: 'url(#Gradient)' }, '& .MuiLineElement-root': { strokeWidth: 4 } }}
            slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'top', horizontal: 'start' } } }}>
            <linearGradient id="Gradient" x1="0%" y1="120%" x2="0%" y2="0%">
                <stop offset="0" stopColor="#FFFFFF77" />
                <stop offset="1" stopColor="#29BAE277" />
            </linearGradient>
        </LineChart>
    )
}
