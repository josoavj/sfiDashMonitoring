import { Menu, MenuItem, Grid, Box, Typography, Stack } from '@mui/material'
import { Timeline, Lan, SyncAlt, Dns } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../../context/NavContext'

const makeIcon = (IconComp) => <IconComp sx={{ color: '#B3B3B3' }} />

const listMenuItems = [
    {
        title: 'Visualisation des données',
        descript: 'Représentez graphiquement vos métriques et journaux pour une analyse rapide et intuitive.',
        page: 'view',
        icon: makeIcon(Timeline),
    },
    {
        title: 'Monitoring IP Source et Destination',
        descript: 'Analysez les communications réseau en identifiant les adresses IP à l\'origine et à la cible du trafic.',
        page: 'ip-view',
        icon: makeIcon(Lan),
    },
    {
        title: 'Flux des données',
        descript: 'Suivez en temps réel la circulation des logs et identifiez les événements critiques.',
        page: 'flow',
        icon: makeIcon(SyncAlt),
    },
    {
        title: 'Monitoring des services actifs',
        descript: 'Surveillez l’état et la disponibilité des services essentiels de votre infrastructure.',
        page: 'service',
        icon: makeIcon(Dns),
    },
    {
        title: 'Bande passante (temps réel)',
        descript: 'Visualisez l’utilisation de la bande passante en temps réel à partir d’Elasticsearch.',
        page: 'bandwidth',
        icon: makeIcon(Lan),
    },
]

export function VisualizationMenu({ anchorEl, handleMenuClose }) {
    const navigate = useNavigate()
    const { setSubItemActive } = useNav()

    return (
        <Menu
            elevation={0}
            marginThreshold={0}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
                paper: {
                    sx: {
                        width: '100%',
                        maxWidth: '100%',
                        borderRadius: 0,
                    },
                },
                list: {
                    sx: {
                        px: 10,
                        py: 3,
                        bgcolor: 'primary.main',
                    },
                },
            }}>
            <Grid container spacing={2}>
                <Grid size={4} sx={{ p: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '75%',
                        }}>
                        <Typography color="text" fontSize={28} fontWeight={600} sx={{ mb: 1.5 }}>
                            Centre de supervision
                        </Typography>
                        <Typography color="text" fontSize={16} lineHeight={1.5}>
                            Vue centralisée de l’activité réseau, des journaux FortiGate et de l’utilisation de la bande
                            passante
                        </Typography>
                    </Box>
                </Grid>

                <Grid container spacing={1} size={8} sx={{ p: 1 }}>
                    {listMenuItems.map((item, idx) => (
                        <Grid key={idx} size={6} sx={{ p: 1 }}>
                            <MenuItem
                                onClick={() => {
                                    handleMenuClose()
                                    if (item.page === 'ip-view') {
                                        navigate('/ip-view')
                                    } else {
                                        setSubItemActive(item)
                                        navigate('/visualization')
                                    }
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'start',
                                    justifyContent: 'center',
                                    p: 2,
                                    whiteSpace: 'normal',
                                    borderRadius: 2,
                                }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2,
                                        p: 1.5,
                                        borderRadius: 50,
                                        bgcolor: 'secondary.lighter',
                                    }}>
                                    {item.icon}
                                </Box>

                                <Stack spacing={0.7}>
                                    <Typography fontSize={18} fontWeight={600} color="text">
                                        {item.title}
                                    </Typography>

                                    <Typography fontSize={14} color="text.normal">
                                        {item.descript}
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Menu>
    )
}
