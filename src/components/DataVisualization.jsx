import { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton, Breadcrumbs, Link, Typography, Grid } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, NavigateNext, AccessTime, Loop } from '@mui/icons-material'
import { AccountCircle, Notifications } from '@mui/icons-material'
import { VisualizationMenu } from './custom-elements/VisualisationMenu'
import { DataMainView } from './dashboard-elements/DataMainView'
import { MaxBytes } from './dashboard-elements/MaxBytes'

const makeIcon = (IconComp) => <IconComp fontSize="15" sx={{ mx: 2 }} />

export function DataVisualization() {
    const [itemActive, setItemActive] = useState('Tableau de bord')
    const [subItemActive, setSubItemActive] = useState({
        title: 'Monitoring IP Source et Destination',
        page: 'ipsource',
    })
    const [anchorEl, setAnchorEl] = useState(null)
    const toolbarRef = useRef(null)
    const navItems = ['Tableau de bord', 'Rapports', 'Alertes', 'Paramètres']

    const lastPreview = 60
    const refresh = 10

    const handleMenuOpen = () => {
        setAnchorEl(toolbarRef.current)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const breadcrumbs = [
        <Link color="text.dark" underline="none" fontSize={15}>
            Accueil
        </Link>,
        <Link color="text.dark" underline="none" fontSize={15}>
            {itemActive}
        </Link>,
    ]

    if (itemActive == 'Tableau de bord' && subItemActive) {
        breadcrumbs.push(
            <Typography color="primary.lighter" fontSize={15}>
                {subItemActive.title}
            </Typography>
        )
    }

    return (
        <>
            <AppBar position="fixed">
                <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Bar de navigation | Icone */}
                    <Box component="img" src="/images/sfi_logo_primary.png" sx={{ mx: 6, width: 55 }} />

                    {/* Bar de navigation | Items */}
                    <Box sx={{ ml: 8 }}>
                        <Stack direction="row" spacing={8}>
                            {navItems.map((item, idx) => (
                                <Box key={idx}>
                                    <Button
                                        disableRipple
                                        onClick={() => {
                                            setItemActive(item)
                                            if (item === 'Tableau de bord') {
                                                anchorEl ? handleMenuClose() : handleMenuOpen()
                                            } else {
                                                setSubItemActive(null)
                                            }
                                        }}
                                        endIcon={
                                            item === 'Tableau de bord' ? (
                                                anchorEl ? (
                                                    <KeyboardArrowUp />
                                                ) : (
                                                    <KeyboardArrowDown />
                                                )
                                            ) : null
                                        }
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: itemActive == item ? 600 : 400,
                                            textTransform: 'none',
                                            color: itemActive == item ? 'text.main' : 'text.normal',
                                        }}>
                                        {item}

                                        {/* Menu */}
                                        {item === 'Tableau de bord' && (
                                            <VisualizationMenu
                                                anchorEl={anchorEl}
                                                handleMenuClose={handleMenuClose}
                                                setSubItemActive={setSubItemActive}
                                            />
                                        )}
                                    </Button>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    {/* Bar de navigation |  profil */}
                    <Box sx={{ ml: 'auto', mr: 4.5 }}>
                        <IconButton sx={{ color: 'secondary.lighter' }}>
                            <Notifications />
                        </IconButton>

                        <IconButton sx={{ color: 'secondary.lighter' }}>
                            <AccountCircle sx={{ fontSize: 35 }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Affichage */}
            <Grid
                container
                spacing={2}
                sx={{
                    px: 7,
                    pt: 10.5,
                    height: '100vh',
                    bgcolor: 'secondary.lighter',
                }}>
                <Grid size={subItemActive?.page === 'flow' ? 10 : 12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>{breadcrumbs}</Breadcrumbs>

                        <Typography color="text.dark" fontSize={15} sx={{ display: 'flex', alignItems: 'center' }}>
                            {makeIcon(AccessTime)} | {makeIcon(Loop)}
                        </Typography>
                    </Box>

                    <Box component="main" sx={{ mt: 2 }}>
                        <DataMainView page={subItemActive?.page} />
                    </Box>
                </Grid>

                {subItemActive?.page === 'flow' && (
                    <Grid size={2} sx={{ my: 1 }}>
                        <Stack spacing={2} sx={{ height: '100%' }}>
                            <MaxBytes />
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </>
    )
}
