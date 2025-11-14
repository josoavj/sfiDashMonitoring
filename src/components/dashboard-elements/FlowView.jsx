import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { onThrottled } from '../../socketClient'

export function FlowView() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    const columns = [
        { field: 'timespan', headerName: 'TIMESPAN', flex: 0.8 },
        { field: 'ipsource', headerName: 'IP SOURCE', flex: 0.7 },
        { field: 'ipdestination', headerName: 'IP DESTINATION', flex: 0.7 },
        { field: 'destination', headerName: 'DESTINATION (Org)', flex: 0.7 },
        { field: 'protocol', headerName: 'PROTOCOLE', flex: 0.6 },
        { field: 'direction', headerName: 'DIRECTION', flex: 0.7 },
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
                const mapped = hits.map((h, i) => ({ id: i + 1, timespan: h._source?.['@timestamp'] || '', ipsource: h._source?.source?.ip || h._source?.client?.ip || '-', ipdestination: h._source?.destination?.ip || h._source?.host?.ip || '-', destination: h._source?.destination?.geo?.organization || '-', protocol: h._source?.network?.protocol || h._source?.network?.type || '-', direction: h._source?.event?.direction || '-' }))
                setRows(mapped)
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
                const mapped = hits.map((h, i) => ({ id: Date.now() + i, timespan: h['@timestamp'] || h._source?.['@timestamp'] || '', ipsource: h._source?.source?.ip || h._source?.client?.ip || h.source?.ip || '-', ipdestination: h._source?.destination?.ip || h._source?.host?.ip || h.destination?.ip || '-', destination: h._source?.destination?.geo?.organization || '-', protocol: h._source?.network?.protocol || h._source?.network?.type || h.network?.protocol || '-', direction: h._source?.event?.direction || '-' }))
                setRows((prev) => {
                    const next = [...mapped, ...prev].slice(0, 200)
                    return next
                })
            } catch (err) {
                console.debug('FlowView socket handler', err)
            }
        }

    const unsubscribe = onThrottled('new-logs', handler, 1000)
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
    }, [])

    return (
        <Box sx={{ width: '100%', height: 'calc(100vh - 200px)' }}>
            <DataGrid columns={columns} rows={rows} hideFooter rowHeight={41} disableColumnResize showToolbar sx={{ height: '100%', '& .MuiDataGrid-columnHeader': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f9f9f9' }, '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#ffffff' } }} />
        </Box>
    )
}
