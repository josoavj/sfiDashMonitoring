import { Grid, Typography, Box, FormControl, InputLabel, Select, MenuItem, Paper, Stack, useTheme, useMediaQuery, Alert, Button } from '@mui/material'
import { useEffect, useRef, useState, useCallback } from 'react'
import { LineChart } from '@mui/x-charts'
import { onThrottled } from '../../socketClient'
import { authFetch } from '../../utils/authFetch'
import ChartLoadingSkeleton from '../common/ChartLoadingSkeleton'

const COLORS = ['#29BAE2', '#E05B5B', '#52B57D', '#F2C94C', '#9B51E0', '#FF8A65']

export function ServiceView() {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const isTablet = useMediaQuery(theme.breakpoints.down('md'))

	const [loading, setLoading] = useState(false)
	const [labels, setLabels] = useState([])
	const [series, setSeries] = useState([])
	const [topNSelection, setTopNSelection] = useState(5)
	const [topN, setTopN] = useState(5) // effective (debounced)
	const [windowSize, setWindowSize] = useState(60)
	const [chartError, setChartError] = useState(null)
	const [protocolSnapshot, setProtocolSnapshot] = useState([])
	const [applicationSnapshot, setApplicationSnapshot] = useState([])
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
				const protocols = payload?.topProtocols || []
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
				setProtocolSnapshot(
					protocols.slice(0, 6).map((p) => {
						const key = p.key || p.protocol || p.name || '-'
						const bytes = p?.bytes?.value || p?.bytes || p?.value || 0
						return {
							key,
							mb: Math.round((bytes / 1024 / 1024) * 100) / 100,
						}
					})
				)
				setApplicationSnapshot(
					tops.slice(0, 6).map((a) => {
						const key = a.key || a.name || a.ip || '-'
						const bytes = a?.bytes?.value || a?.bytes || a?.value || 0
						return {
							key,
							mb: Math.round((bytes / 1024 / 1024) * 100) / 100,
						}
					})
				)
				setChartError(null)
				trackedKeysRef.current = keys
			} catch (err) {
				console.debug('ServiceView realtime handler', err)
			}
		}

		const unsubscribe = onThrottled('top-bandwidth', handler, 1000)
		return () => { if (typeof unsubscribe === 'function') unsubscribe() }
	}, [topN, windowSize])

	const reloadServiceChart = useCallback(async () => {
		setLoading(true)
		setChartError(null)
		try {
			const to = new Date()
			const from = new Date(to.getTime() - 1000 * 60 * 60)
			const res = await authFetch('/api/protocols', {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: from.toISOString(), to: to.toISOString() }, size: 10 }),
			})
			if (!res.ok) {
				setChartError('Impossible de charger les données des services.')
				setSeries([])
				setLabels([])
				return
			}
			const data = await res.json()
			seriesRef.current = {}
			const tops = data?.applications || data?.topApplications || []
			const protocols = data?.protocols || []
			tops.slice(0, topN).forEach((a) => {
				const k = a.key || a.name || a.ip || String(a)
				const bytes = a?.bytes?.value || a?.value || 0
				seriesRef.current[k] = [Math.round((bytes / 1024 / 1024) * 100) / 100]
			})
			setProtocolSnapshot(
				protocols.slice(0, 6).map((p) => {
					const key = p.key || p.protocol || p.name || '-'
					const bytes = p?.bytes?.value || p?.bytes || p?.value || 0
					return {
						key,
						mb: Math.round((bytes / 1024 / 1024) * 100) / 100,
					}
				})
			)
			setApplicationSnapshot(
				tops.slice(0, 6).map((a) => {
					const key = a.key || a.name || a.ip || '-'
					const bytes = a?.bytes?.value || a?.bytes || a?.value || 0
					return {
						key,
						mb: Math.round((bytes / 1024 / 1024) * 100) / 100,
					}
				})
			)
			const keysNow = Object.keys(seriesRef.current)
			setSeries(keysNow.map((k, i) => ({ data: seriesRef.current[k], label: k, color: COLORS[i % COLORS.length] })))
		} catch (err) {
			console.error('ServiceView initial fetch', err)
			setChartError('Impossible de charger les données des services.')
			setSeries([])
			setLabels([])
			setProtocolSnapshot([])
			setApplicationSnapshot([])
		} finally {
			setLoading(false)
		}
	}, [topN])

	// initial fetch to populate lists (non-blocking)
	useEffect(() => {
		reloadServiceChart()
	}, [reloadServiceChart])

	// debounce UI selection for topN to avoid flicker
	useEffect(() => {
		if (topNDebounceRef.current) clearTimeout(topNDebounceRef.current)
		topNDebounceRef.current = setTimeout(() => setTopN(topNSelection), 350)
		return () => { if (topNDebounceRef.current) clearTimeout(topNDebounceRef.current) }
	}, [topNSelection])

	const trackedCount = Object.keys(seriesRef.current || {}).length
	const chartHeight = isMobile ? 220 : isTablet ? 260 : 300
	const hasChartData = labels.length > 0 && series.length > 0
	const protocolMax = Math.max(...protocolSnapshot.map((p) => p.mb), 0)
	const appMax = Math.max(...applicationSnapshot.map((a) => a.mb), 0)

	return (
		<Box sx={{ width: '100%' }}>
			<Grid container spacing={2.5} sx={{ width: '100%' }}>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(41, 186, 226, 0.08)', height: '100%' }}>
						<Typography fontSize={12} color="text.secondary">Séries suivies</Typography>
						<Typography fontSize={30} fontWeight={700} sx={{ color: '#29BAE2', lineHeight: 1.1 }}>{trackedCount}</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(82, 181, 125, 0.1)', height: '100%' }}>
						<Typography fontSize={12} color="text.secondary">Top N affiché</Typography>
						<Typography fontSize={30} fontWeight={700} sx={{ color: '#52B57D', lineHeight: 1.1 }}>{topN}</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(242, 201, 76, 0.12)', height: '100%' }}>
						<Typography fontSize={12} color="text.secondary">Fenêtre</Typography>
						<Typography fontSize={30} fontWeight={700} sx={{ color: '#F2C94C', lineHeight: 1.1 }}>{windowSize}</Typography>
						<Typography fontSize={12} color="text.secondary">points</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(224, 91, 91, 0.08)', height: '100%' }}>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent="space-between">
							<FormControl size="small" sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}>
								<InputLabel id="topn-label">Top N</InputLabel>
								<Select labelId="topn-label" value={topNSelection} label="Top N" onChange={(e) => setTopNSelection(Number(e.target.value))}>
									<MenuItem value={3}>Top 3</MenuItem>
									<MenuItem value={5}>Top 5</MenuItem>
									<MenuItem value={10}>Top 10</MenuItem>
								</Select>
							</FormControl>

							<FormControl size="small" sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' } }}>
								<InputLabel id="window-label">Fenêtre</InputLabel>
								<Select labelId="window-label" value={windowSize} label="Fenêtre" onChange={(e) => setWindowSize(Number(e.target.value))}>
									<MenuItem value={30}>30</MenuItem>
									<MenuItem value={60}>60</MenuItem>
									<MenuItem value={120}>120</MenuItem>
								</Select>
							</FormControl>
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12 }}>
					<Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
						<Box sx={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
						{!hasChartData && loading ? (
							<ChartLoadingSkeleton height={chartHeight} chartType="area" />
						) : null}
						{!hasChartData && !loading && chartError ? (
							<Stack spacing={1.5} sx={{ width: '100%', maxWidth: 520 }}>
								<Alert severity="error">{chartError}</Alert>
								<Box sx={{ display: 'flex', justifyContent: 'center' }}><Button variant="outlined" onClick={reloadServiceChart}>Réessayer</Button></Box>
							</Stack>
						) : null}
						{!hasChartData && !loading && !chartError ? (
							<Typography color="text.secondary">Pas de données temps réel pour les services</Typography>
						) : null}
						{hasChartData ? (
							<LineChart
								xAxis={[{ scaleType: 'point', data: labels, showMark: false }]}
								series={series}
								grid={{ vertical: true, horizontal: true }}
								margin={{ left: 20, bottom: 20 }}
								height={chartHeight}
								sx={{ width: '100%', '& .MuiAreaElement-root': { fill: 'url(#SvcGradient)' }, '& .MuiLineElement-root': { strokeWidth: 2 } }}
								slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'top', horizontal: 'start' } } }}>
								<linearGradient id="SvcGradient" x1="0%" y1="120%" x2="0%" y2="0%">
									<stop offset="0" stopColor="#FFFFFF77" />
									<stop offset="1" stopColor="#29BAE277" />
								</linearGradient>
							</LineChart>
						) : null}
						</Box>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper elevation={0} sx={{ p: { xs: 1.75, md: 2 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%', minHeight: 260 }}>
						<Typography fontWeight={600} sx={{ mb: 1.5 }}>Top Protocoles (instantané)</Typography>
						{protocolSnapshot.length === 0 ? (
							<Typography color="text.secondary" fontSize={14}>Aucun protocole à afficher.</Typography>
						) : (
							<Stack spacing={1}>
								{protocolSnapshot.map((item) => (
									<Box key={item.key} sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
										<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
											<Typography fontWeight={700} fontSize={13}>{item.key}</Typography>
											<Typography fontSize={12} color="text.secondary">{item.mb.toFixed(2)} MB</Typography>
										</Stack>
										<Box sx={{ height: 7, borderRadius: 999, bgcolor: 'rgba(41, 186, 226, 0.15)', overflow: 'hidden' }}>
											<Box sx={{ width: `${protocolMax > 0 ? (item.mb / protocolMax) * 100 : 0}%`, height: '100%', bgcolor: '#29BAE2' }} />
										</Box>
									</Box>
								))}
							</Stack>
						)}
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper elevation={0} sx={{ p: { xs: 1.75, md: 2 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%', minHeight: 260 }}>
						<Typography fontWeight={600} sx={{ mb: 1.5 }}>Top Applications / Ports (instantané)</Typography>
						{applicationSnapshot.length === 0 ? (
							<Typography color="text.secondary" fontSize={14}>Aucune application/port à afficher.</Typography>
						) : (
							<Stack spacing={1}>
								{applicationSnapshot.map((item) => (
									<Box key={item.key} sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
										<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75, gap: 1 }}>
											<Typography fontWeight={700} fontSize={13} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.key}</Typography>
											<Typography fontSize={12} color="text.secondary" sx={{ flexShrink: 0 }}>{item.mb.toFixed(2)} MB</Typography>
										</Stack>
										<Box sx={{ height: 7, borderRadius: 999, bgcolor: 'rgba(82, 181, 125, 0.15)', overflow: 'hidden' }}>
											<Box sx={{ width: `${appMax > 0 ? (item.mb / appMax) * 100 : 0}%`, height: '100%', bgcolor: '#52B57D' }} />
										</Box>
									</Box>
								))}
							</Stack>
						)}
					</Paper>
				</Grid>
			</Grid>
		</Box>
	)
}

