import { useState } from 'react'
import { Box, Stack, Breadcrumbs, Link, Typography, Grid, Paper, IconButton, Chip } from '@mui/material'
import { NavigateNext, AccessTime, Loop, Home, Dashboard } from '@mui/icons-material'
import { DataMainView } from './dashboard-elements/DataMainView'
import { MaxBytes } from './dashboard-elements/MaxBytes'
import { useNav } from '../context/NavContext'

export function DataVisualization() {
    const { subItemActive } = useNav()
    
    const breadcrumbs = [
        <Link 
            color="inherit" 
            underline="hover" 
            fontSize={14}
            key="home"
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
                transition: 'color 0.2s'
            }}
        >
            <Home sx={{ fontSize: 16 }} />
            Accueil
        </Link>,
        <Link 
            color="inherit" 
            underline="hover" 
            fontSize={14}
            key="dash"
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
                transition: 'color 0.2s'
            }}
        >
            <Dashboard sx={{ fontSize: 16 }} />
            Tableau de bord
        </Link>,
    ]
    
    if (subItemActive) {
        breadcrumbs.push(
            <Typography 
                color="primary.main" 
                fontSize={14} 
                key="sub"
                sx={{ 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {subItemActive.title}
            </Typography>
        )
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                pt: { xs: 11, sm: 10, md: 9 },
                p: (subItemActive?.page === 'bandwidth' || subItemActive?.page === 'ipsource' || subItemActive?.page === 'flow' || subItemActive?.page === 'service') ? 0 : { xs: 2, sm: 3, md: 4 },
            }}
        >
            {(subItemActive?.page === 'bandwidth' || subItemActive?.page === 'ipsource' || subItemActive?.page === 'flow' || subItemActive?.page === 'service') ? (
                // Full width pages - no header, only top padding for TopBar
                <Box sx={{ width: '100%', height: '100%' }}>
                    <DataMainView page={subItemActive?.page} />
                </Box>
            ) : (
                // Dashboard view with header
                <Box sx={{ maxWidth: '1800px', mx: 'auto', width: '100%' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={subItemActive?.page === 'flow' ? 9.5 : 12}>
                            {/* Header Card */}
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    p: 3, 
                                    mb: 3,
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 2
                                }}>
                                    <Box>
                                        <Breadcrumbs 
                                            separator={<NavigateNext fontSize="small" sx={{ color: 'text.disabled' }} />}
                                            sx={{ mb: 1 }}
                                        >
                                            {breadcrumbs}
                                        </Breadcrumbs>
                                        {subItemActive && (
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: 'text.primary',
                                                    letterSpacing: '-0.5px'
                                                }}
                                            >
                                                {subItemActive.title}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Chip
                                            icon={<AccessTime sx={{ fontSize: 18 }} />}
                                            label="Temps réel"
                                            size="small"
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                fontWeight: 500,
                                                '& .MuiChip-icon': { color: 'white' }
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            sx={{
                                                bgcolor: 'action.hover',
                                                '&:hover': {
                                                    bgcolor: 'action.selected',
                                                    transform: 'rotate(180deg)',
                                                    transition: 'transform 0.3s ease'
                                                }
                                            }}
                                        >
                                            <Loop sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Main Content */}
                            <Paper
                                elevation={0}
                                sx={{
                                    background: 'white',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    minHeight: 'calc(100vh - 280px)'
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <DataMainView page={subItemActive?.page} />
                                </Box>
                            </Paper>
                        </Grid>

                        {subItemActive?.page === 'flow' && (
                            <Grid item xs={12} lg={2.5}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        background: 'white',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        p: 2,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        position: { lg: 'sticky' },
                                        top: { lg: 130 },
                                        height: 'fit-content'
                                    }}
                                >
                                    <MaxBytes />
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}
        </Box>
    )
}