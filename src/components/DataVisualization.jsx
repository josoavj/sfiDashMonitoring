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
                pt: { xs: 12, sm: 11, md: 10 },
                pb: 4,
                px: { xs: 1, sm: 2, md: 3 },
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* En-tête principal */}
            <Paper
                elevation={0}
                sx={{
                    background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
                    borderRadius: 2,
                    p: { xs: 2, sm: 3, md: 4 },
                    color: 'white',
                    mb: 3
                }}
            >
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 1.5, sm: 2 }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ flex: 1 }}>
                        <DashboardIcon sx={{ fontSize: { xs: 28, sm: 32, md: 40 }, flexShrink: 0 }} />
                        <Box>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 700, 
                                    mb: 0.5, 
                                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
                                }}
                            >
                                Tableau de Bord
                            </Typography>
                            <Typography sx={{ opacity: 0.95, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' } }}>
                                Analyse complète du trafic réseau en temps réel
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Chip
                            label="Temps réel"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.85rem' }
                            }}
                        />
                        <IconButton
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                width: { xs: 36, sm: 40 },
                                height: { xs: 36, sm: 40 }
                            }}
                        >
                            <Refresh sx={{ fontSize: { xs: 18, sm: 20 } }} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Paper>

            {/* Contenu actif - occupe toute la largeur et hauteur restante */}
            <Paper
                elevation={0}
                sx={{
                    background: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Tabs barre de navigation - scrollable sur mobile */}
                <Box 
                    sx={{ 
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        px: 0,
                        overflowX: { xs: 'auto', md: 'hidden' }
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' },
                                minHeight: { xs: 48, sm: 56 },
                                py: { xs: 1.5, sm: 2 },
                                px: { xs: 1.5, sm: 2 },
                                minWidth: { xs: 'auto', sm: 120 },
                                color: 'text.secondary',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap',
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
                            <Tab key={idx} label={card.title} icon={<card.icon sx={{ fontSize: { xs: 16, sm: 18 }, mr: 0.5 }} />} iconPosition="start" />
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