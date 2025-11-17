import { ChartView } from './ChartView'
import { FlowView } from './FlowView'
import { ServiceView } from './ServiceView'
import BandwidthView from './BandwidthView'
import { Grid, Paper, Box, Typography } from '@mui/material'
import SocketStatus from '../SocketStatus'
import { TrendingUp, Cloud, Lan, Settings } from '@mui/icons-material'

export function DataMainView({ page }) {
	// Configurations des pages individuelles
	const pageConfig = {
		flow: {
			title: 'Flux Réseau',
			subtitle: 'Visualisation des flux de données réseau en temps réel',
			icon: Cloud,
			color: '#02647E',
			component: FlowView
		},
		bandwidth: {
			title: 'Bande Passante',
			subtitle: 'Monitoring de la bande passante réseau',
			icon: TrendingUp,
			color: '#02647E',
			component: BandwidthView
		},
		service: {
			title: 'Services',
			subtitle: 'Analyse des services réseau et applications',
			icon: Settings,
			color: '#02647E',
			component: ServiceView
		}
	}

	// Créer l'en-tête pour les pages individuelles
	const renderFullPageHeader = (config) => {
		const IconComponent = config.icon
		return (
			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 3,
					background: `linear-gradient(135deg, ${config.color} 0%, #72BDD1 100%)`,
					borderRadius: 2,
					color: 'white',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
					<IconComponent sx={{ fontSize: 40 }} />
					<Box>
						<Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
							{config.title}
						</Typography>
						<Typography sx={{ opacity: 0.9 }}>
							{config.subtitle}
						</Typography>
					</Box>
				</Box>
			</Paper>
		)
	}

	// Main dashboard: when page is 'view' or undefined, show a composed dashboard
	if (!page || page === 'view') {
		return (
			<>
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}><SocketStatus /></Box>
				<Box sx={{ p: { xs: 2, sm: 3, md: 4 }, pt: 0 }}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={8}>
							<Paper sx={{ p: 1 }}>
								<ChartView />
							</Paper>
						</Grid>

						<Grid item xs={12} md={4}>
							<Paper sx={{ p: 1, mb: 2 }}>
								<BandwidthView />
							</Paper>
							<Paper sx={{ p: 1 }}>
								<ServiceView />
							</Paper>
						</Grid>

						<Grid item xs={12}>
							<Paper sx={{ p: 1 }}>
								<FlowView />
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</>
		)
	}

	// Pages individuelles fullscreen
	if (page && pageConfig[page]) {
		const config = pageConfig[page]
		const Component = config.component
		const padding = page === 'flow' ? 0 : 2

		return (
			<>
				<Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
					{renderFullPageHeader(config)}
				</Box>
				<Box sx={{ width: '100%', p: padding, pt: 0, mt: 0, px: { xs: 2, sm: 3, md: 4 } }}>
					<Component />
				</Box>
			</>
		)
	}

	return null
}

