import { Grid, Typography, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { LineChart } from '@mui/x-charts'
import { onThrottled } from '../../socketClient'

const COLORS = ['#29BAE2', '#E05B5B', '#52B57D', '#F2C94C', '#9B51E0', '#FF8A65']

export function ServiceView() {
	const [loading, setLoading] = useState(false)
	const [labels, setLabels] = useState([])
	const [series, setSeries] = useState([])
	const [topNSelection, setTopNSelection] = useState(5)
	const [topN, setTopN] = useState(5) // effective (debounced)
	const [windowSize, setWindowSize] = useState(60)
	const topNDebounceRef = useRef(null)

	// keep series data in a ref to append without causing re-creation issues
	const seriesRef = useRef({}) // key -> array of numbers
	const trackedKeysRef = useRef([])

	useEffect(() => {
		// handler receives payloads with topApplications and topProtocols
		const handler = (payload) => {
			try {
				const t = payload?.timestamp || Date.now()
				const label = new Date(t)
				const hh = String(label.getHours()).padStart(2, '0')
				const mm = String(label.getMinutes()).padStart(2, '0')
				const ss = String(label.getSeconds()).padStart(2, '0')
				const lab = `${hh}:${mm}:${ss}`

				const tops = payload?.topApplications || payload?.top || []
				// determine top keys (limit to topN)
				const keys = (tops || []).slice(0, topN).map((a) => a.key || a.name || a.ip || String(a))

				// ensure seriesRef contains entries for keys
				keys.forEach((k) => { if (!seriesRef.current[k]) seriesRef.current[k] = [] })

				// append values per key
				keys.forEach((k) => {
					const item = (tops || []).find((x) => (x.key || x.name || x.ip) === k)
					const bytes = item?.bytes?.value || item?.value || item?.count || 0
					const mb = Math.round((bytes / 1024 / 1024) * 100) / 100
					seriesRef.current[k].push(mb)
					if (seriesRef.current[k].length > windowSize) seriesRef.current[k].shift()
				})

				// keep labels in sync
				setLabels((prev) => {
					const next = [...prev.slice(-59), lab]
					return next
				})

				// rebuild series array for chart
				const keysNow = Object.keys(seriesRef.current)
				const newSeries = keysNow.map((k, i) => ({ data: seriesRef.current[k].slice(-windowSize), label: k, color: COLORS[i % COLORS.length] }))
				setSeries(newSeries)
				trackedKeysRef.current = keys
			} catch (err) {
				console.debug('ServiceView realtime handler', err)
			}
		}

		const unsubscribe = onThrottled('top-bandwidth', handler, 1000)
		return () => { if (typeof unsubscribe === 'function') unsubscribe() }
	}, [topN, windowSize])

	// initial fetch to populate lists (non-blocking)
	useEffect(() => {
		setLoading(true)
		;(async () => {
			try {
				const to = new Date()
				const from = new Date(to.getTime() - 1000 * 60 * 60)
				const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/protocols', {
					method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 10 }),
				})
				const data = await res.json()
				// pre-seed seriesRef with current topApplications if present
				const tops = data?.applications || data?.topApplications || []
				tops.slice(0, topN).forEach((a) => {
					const k = a.key || a.name || a.ip || String(a)
					const bytes = a?.bytes?.value || a?.value || 0
					seriesRef.current[k] = [Math.round((bytes / 1024 / 1024) * 100) / 100]
				})
				const keysNow = Object.keys(seriesRef.current)
				setSeries(keysNow.map((k, i) => ({ data: seriesRef.current[k], label: k, color: COLORS[i % COLORS.length] })))
			} catch (err) {
				console.error('ServiceView initial fetch', err)
			} finally {
				setLoading(false)
			}
		})()
	}, [topN, windowSize])

	// debounce UI selection for topN to avoid flicker
	useEffect(() => {
		if (topNDebounceRef.current) clearTimeout(topNDebounceRef.current)
		topNDebounceRef.current = setTimeout(() => setTopN(topNSelection), 350)
		return () => { if (topNDebounceRef.current) clearTimeout(topNDebounceRef.current) }
	}, [topNSelection])

	if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>

	return (
		<Grid container spacing={2}>
			<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
				<FormControl size="small" sx={{ minWidth: 120 }}>
					<InputLabel id="topn-label">Top N</InputLabel>
					<Select labelId="topn-label" value={topNSelection} label="Top N" onChange={(e) => setTopNSelection(Number(e.target.value))}>
						<MenuItem value={3}>Top 3</MenuItem>
						<MenuItem value={5}>Top 5</MenuItem>
						<MenuItem value={10}>Top 10</MenuItem>
					</Select>
				</FormControl>

				<FormControl size="small" sx={{ minWidth: 140 }}>
					<InputLabel id="window-label">Fenêtre (points)</InputLabel>
					<Select labelId="window-label" value={windowSize} label="Fenêtre (points)" onChange={(e) => setWindowSize(Number(e.target.value))}>
						<MenuItem value={30}>30 points</MenuItem>
						<MenuItem value={60}>60 points</MenuItem>
						<MenuItem value={120}>120 points</MenuItem>
					</Select>
				</FormControl>
			</Grid>
			<Grid item xs={12}>
				{labels.length && series.length ? (
					<LineChart
						xAxis={[{ scaleType: 'point', data: labels, showMark: false }]}
						series={series}
						grid={{ vertical: true, horizontal: true }}
						margin={{ left: 0, bottom: 0 }}
						height={260}
						sx={{ '& .MuiAreaElement-root': { fill: 'url(#SvcGradient)' }, '& .MuiLineElement-root': { strokeWidth: 2 } }}
						slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'top', horizontal: 'start' } } }}>
						<linearGradient id="SvcGradient" x1="0%" y1="120%" x2="0%" y2="0%">
							<stop offset="0" stopColor="#FFFFFF77" />
							<stop offset="1" stopColor="#29BAE277" />
						</linearGradient>
					</LineChart>
				) : (
					<Typography color="text.secondary">Pas de données temps réel pour les services</Typography>
				)}
			</Grid>

			<Grid item xs={6}>
				<Typography fontWeight={600} sx={{ mb: 1 }}>Top Protocoles (instantané)</Typography>
				{/* lightweight list will be filled from last received payloads if present in seriesRef */}
				{Object.keys(seriesRef.current || {}).slice(0, 6).map((k) => (
					<Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
						<Typography fontWeight={700}>{k}</Typography>
						<Typography>{((seriesRef.current[k]?.slice(-1)[0] || 0)).toFixed(2)} MB</Typography>
					</Box>
				))}
			</Grid>

			<Grid item xs={6}>
				<Typography fontWeight={600} sx={{ mb: 1 }}>Top Applications / Ports (instantané)</Typography>
				{Object.keys(seriesRef.current || {}).slice(0, 6).map((k) => (
					<Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
						<Typography fontWeight={700}>{k}</Typography>
						<Typography>{((seriesRef.current[k]?.slice(-1)[0] || 0)).toFixed(2)} MB</Typography>
					</Box>
				))}
			</Grid>
		</Grid>
	)
}

