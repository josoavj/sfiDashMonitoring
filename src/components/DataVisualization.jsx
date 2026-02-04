import { useState } from 'react'
import { 
    Box, 
    Stack, 
    Paper, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Chip,
    IconButton,
    Tabs,
    Tab
} from '@mui/material'
import { 
    Dashboard as DashboardIcon,
    TrendingUp,
    Speed,
    SignalCellularAlt,
    Refresh,
    Info as InfoIcon
} from '@mui/icons-material'
import { memo } from 'react'
import BandwidthView from './dashboard-elements/BandwidthView'
import { IPSourceView } from './dashboard-elements/IPSourceView'
import { FlowView } from './dashboard-elements/FlowView'
import { ServiceView } from './dashboard-elements/ServiceView'

function DataVisualization() {
    const [activeTab, setActiveTab] = useState(0)

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const dashboardCards = [
        {
            id: 'bandwidth',
            title: 'Bande Passante',
            icon: TrendingUp,
            description: 'Analyse en temps réel du débit réseau',
            color: '#02647E'
        },
        {
            id: 'ipsource',
            title: 'Sources IP',
            icon: Speed,
            description: 'Top IPs sources avec leurs statistiques',
            color: '#29BAE2'
        },
        {
            id: 'flow',
            title: 'Flux Réseau',
            icon: SignalCellularAlt,
            description: 'Détail des flux entre IPs',
            color: '#52B57D'
        },
        {
            id: 'service',
            title: 'Services & Protocoles',
            icon: InfoIcon,
            description: 'Utilisation par service et protocole',
            color: '#F2C94C'
        }
    ]

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                pt: { xs: 14, sm: 13, md: 12 },
                pb: 4,
                px: 0,
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* En-tête principal */}
            <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mb: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
                        borderRadius: 2,
                        p: { xs: 2.5, sm: 3.5, md: 4 },
                        color: 'white'
                    }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <DashboardIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Tableau de Bord
                                </Typography>
                                <Typography sx={{ opacity: 0.95, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                    Analyse complète du trafic réseau en temps réel
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                label="Temps réel"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 600,
                                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' }
                                }}
                            />
                            <IconButton
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                                }}
                            >
                                <Refresh />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            {/* Contenu actif - occupe toute la largeur et hauteur restante */}
            <Paper
                elevation={0}
                sx={{
                    background: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 'none',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    mx: { xs: 1, sm: 2, md: 3 },
                    mb: 3
                }}
            >
                {/* Tabs barre de navigation */}
                <Box 
                    sx={{ 
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        px: { xs: 1, sm: 2, md: 3 }
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                minHeight: 56,
                                py: 2,
                                color: 'text.secondary',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'rgba(2, 100, 126, 0.05)'
                                }
                            },
                            '& .MuiTab-root.Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 700
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '2px 2px 0 0'
                            }
                        }}
                    >
                        {dashboardCards.map((card, idx) => (
                            <Tab key={idx} label={card.title} />
                        ))}
                    </Tabs>
                </Box>

                {/* Contenu - occupe toute la hauteur restante */}
                <Box 
                    sx={{ 
                        flex: 1,
                        overflow: 'auto',
                        p: { xs: 1.5, sm: 2, md: 3 },
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {activeTab === 0 && <BandwidthView />}
                    {activeTab === 1 && <IPSourceView />}
                    {activeTab === 2 && <FlowView />}
                    {activeTab === 3 && <ServiceView />}
                </Box>
            </Paper>
        </Box>
    )
}

export default memo(DataVisualization)