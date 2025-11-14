import { Grid, Typography, Stack, CircularProgress, IconButton, Tooltip, Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { North, South, Refresh } from '@mui/icons-material'
import { SparklineSource } from '../custom-elements/SparklineSource'
import { GaugeFlow } from '../custom-elements/GaugeFlow'
import { useEffect, useState } from 'react'
import { onThrottled } from '../../socketClient'

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
                <Stack spacing={1}>
                    <SparklineSource icon={makeIcon(North)} title={'Max netflow.octet_delta_count'} />

                    <GaugeFlow
                        icon={makeIcon(North)}
                        title={'Max destination.bytes'}
                        description={'Pic du trafic sortant, charge maximale émise.'}
                        gaugeValue={64.7}
                        gaugeColor={'#E05B5B'}
                        dataUnite={'MB/s'}
                        layoutType="row"
                    />

                    <GaugeFlow
                        icon={makeIcon(South)}
                        title={'Max sources.bytes'}
                        description={'Pic du trafic entrant, réception maximale.'}
                        gaugeValue={80.3}
                        gaugeColor={'#52B57D'}
                        dataUnite={'kB/s'}
                        layoutType="row"
                    />
                </Stack>
            </Grid>
        </Grid>
    )
}
