import React, { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton, Drawer, List, ListItemButton, Divider, ListItemIcon, ListItemText, Typography, Chip } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Menu, Dashboard, Public, Explore, Description, Warning, Settings, Person, Close, ChevronRight } from '@mui/icons-material'
import { AccountCircle } from '@mui/icons-material'
import { VisualizationMenu } from './custom-elements/VisualisationMenu'
import { NotificationButton } from './NotificationButton'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNav } from '../context/NavContext'

const menuIconsMap = {
  'Tableau de bord': <Dashboard sx={{ fontSize: 24 }} />,
  'IPs': <Public sx={{ fontSize: 24 }} />,
  'Exploration': <Explore sx={{ fontSize: 24 }} />,
  'Rapports': <Description sx={{ fontSize: 24 }} />,
  'Alertes': <Warning sx={{ fontSize: 24 }} />,
  'Paramètres': <Settings sx={{ fontSize: 24 }} />
}

const routeByItem = {
  'Tableau de bord': '/visualization',
  'IPs': '/ip-view',
  'Exploration': '/exploration',
  'Rapports': '/reports',
  'Alertes': '/alerts',
  'Paramètres': '/settings'
}

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const toolbarRef = useRef(null)
  const closeMenuTimerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { subItemActive } = useNav()
  const navItems = ['Tableau de bord', 'IPs', 'Exploration', 'Rapports', 'Alertes', 'Paramètres']

  // Ne pas afficher la TopBar sur les pages d'authentification
  const isAuthPage = location.pathname === '/auth/login' || location.pathname === '/auth/signup'
  if (isAuthPage) return null

  const handleMenuOpen = () => setAnchorEl(toolbarRef.current)
  const handleMenuClose = () => setAnchorEl(null)

  const clearCloseMenuTimer = () => {
    if (closeMenuTimerRef.current) {
      clearTimeout(closeMenuTimerRef.current)
      closeMenuTimerRef.current = null
    }
  }

  const handleDashboardHoverOpen = () => {
    clearCloseMenuTimer()
    setAnchorEl(toolbarRef.current)
  }

  const handleDashboardHoverClose = () => {
    clearCloseMenuTimer()
    closeMenuTimerRef.current = setTimeout(() => {
      setAnchorEl(null)
    }, 180)
  }

  const handleMobileMenuOpen = () => setMobileMenuOpen(true)
  const handleMobileMenuClose = () => setMobileMenuOpen(false)

  const handleNavigate = (path) => {
    navigate(path)
    handleMobileMenuClose()
  }

  const isItemActive = (item) => {
    if (item === 'Tableau de bord') {
      return location.pathname === '/visualization'
    } else if (item === 'IPs') {
      return location.pathname === '/ip-view'
    } else if (item === 'Exploration') {
      return location.pathname === '/exploration'
    } else if (item === 'Rapports') {
      return location.pathname === '/reports'
    } else if (item === 'Paramètres') {
      return location.pathname === '/settings'
    } else if (item === 'Alertes') {
      return location.pathname === '/alerts'
    }
    return false
  }

  return (
    <AppBar position="fixed" sx={{ background: 'linear-gradient(135deg, #02647E 0%, #0A7D98 60%, #1598B2 100%)', color: 'common.white', boxShadow: '0 8px 24px rgba(2,100,126,0.28)', borderBottom: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
      <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: { xs: 60, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
        {/* Logo */}
        <Box component="img" src="/images/sfi_logo_primary.png" sx={{ width: { xs: 38, sm: 50, md: 55 }, flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }} />

        {/* Menu Desktop - Centré */}
        <Box sx={{ ml: { xs: 1, sm: 2, md: 6 }, display: { xs: 'none', md: 'block' }, flex: 1 }}>
          <Stack direction="row" spacing={{ md: 1.2, lg: 1.8 }} justifyContent="center" alignItems="center">
            {navItems.map((item, idx) => {
              const isActive = isItemActive(item)
              const hasUnderline = item !== 'Tableau de bord'
              return (
                <Box key={idx}>
                  <Button
                    disableRipple
                    onMouseEnter={item === 'Tableau de bord' ? handleDashboardHoverOpen : undefined}
                    onMouseLeave={item === 'Tableau de bord' ? handleDashboardHoverClose : undefined}
                    onClick={() => {
                      if (item === 'Tableau de bord') {
                        anchorEl ? handleMenuClose() : handleMenuOpen()
                      } else if (item === 'IPs') {
                        handleMenuClose()
                        navigate('/ip-view')
                      } else if (item === 'Exploration') {
                        handleMenuClose()
                        navigate('/exploration')
                      } else if (item === 'Rapports') {
                        handleMenuClose()
                        navigate('/reports')
                      } else if (item === 'Paramètres') {
                        handleMenuClose()
                        navigate('/settings')
                      } else if (item === 'Alertes') {
                        handleMenuClose()
                        navigate('/alerts')
                      }
                    }}
                    endIcon={item === 'Tableau de bord' ? anchorEl ? <KeyboardArrowUp /> : <KeyboardArrowDown /> : null}
                    sx={{
                      fontSize: { md: 14, lg: 15 },
                      textTransform: 'none',
                      color: 'common.white',
                      fontWeight: isActive ? 700 : 500,
                      position: 'relative',
                      py: 0.95,
                      px: { md: 1.3, lg: 1.8 },
                      borderRadius: 1,
                      backgroundColor: 'transparent',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        width: hasUnderline && isActive ? '100%' : '0%',
                        height: '3px',
                        backgroundColor: 'white',
                        borderRadius: '2px 2px 0 0',
                        transition: 'width 0.25s ease'
                      },
                      '& .MuiButton-endIcon': {
                        ml: 0.6,
                        color: 'rgba(255,255,255,0.95)'
                      },
                      '&:hover': {
                        backgroundColor: 'transparent'
                      },
                      '&:hover::after': {
                        width: hasUnderline ? '100%' : '0%'
                      },
                      transition: 'color 0.2s ease'
                    }}>
                    {item}

                    {item === 'Tableau de bord' && (
                      <VisualizationMenu
                        anchorEl={anchorEl}
                        handleMenuClose={handleMenuClose}
                        onMenuMouseEnter={clearCloseMenuTimer}
                        onMenuMouseLeave={handleDashboardHoverClose}
                        setSubItemActive={() => {}}
                      />
                    )}
                  </Button>
                </Box>
              )
            })}
          </Stack>
        </Box>

        {/* Actions à droite */}
        <Box sx={{ ml: { xs: 'auto', sm: 2, md: 3 }, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5, md: 1.2 } }}>
          {/* Notifications - Visible partout */}
          <NotificationButton />

          {/* Profil - Visible partout */}
          <IconButton 
            sx={{ 
              color: 'common.white',
              backgroundColor: { md: 'rgba(255,255,255,0.08)' },
              border: { md: '1px solid rgba(255,255,255,0.18)' },
              '&:hover': { backgroundColor: { md: 'rgba(255,255,255,0.08)' } },
              transition: 'all 0.2s ease'
            }} 
            onClick={() => navigate('/profile')} 
            title="Mon profil"
          >
            <AccountCircle sx={{ fontSize: { xs: 30, sm: 35 } }} />
          </IconButton>

          {/* Menu Hamburger Mobile - Seulement en mobile */}
          <IconButton 
            sx={{ 
              color: 'common.white', 
              display: { xs: 'flex', md: 'none' },
              '&:hover': { backgroundColor: 'transparent' },
              transition: 'all 0.2s ease'
            }} 
            onClick={handleMobileMenuOpen}
            title="Menu"
          >
            <Menu sx={{ fontSize: { xs: 26, md: 28 } }} />
          </IconButton>
        </Box>

        {/* Drawer Menu Mobile */}
        <Drawer 
          anchor="right" 
          open={mobileMenuOpen} 
          onClose={handleMobileMenuClose}
          PaperProps={{
            sx: {
              width: { xs: '86vw', sm: 320 },
              maxWidth: 360,
              background: 'linear-gradient(160deg, #f8fafc 0%, #eef3f8 100%)',
              backdropFilter: 'blur(10px)',
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              borderLeft: '1px solid rgba(2, 100, 126, 0.15)',
              boxShadow: '-10px 0 30px rgba(2, 100, 126, 0.18)'
            }
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Drawer */}
            <Box sx={{ 
              p: 2.5, 
              background: 'linear-gradient(135deg, #02647E 0%, #2b9bb4 100%)',
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>Menu</Typography>
                <IconButton 
                  onClick={handleMobileMenuClose}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                >
                  <Close />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)' }}>
                <AccountCircle sx={{ fontSize: 34 }} />
                <Box>
                  <Typography sx={{ fontSize: 13, opacity: 0.9 }}>Navigation rapide</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Espace SFI Monitoring</Typography>
                </Box>
              </Box>
            </Box>

            {/* Menu Items */}
            <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto' }}>
              <Typography sx={{ px: 1, mb: 1, fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Navigation principale
              </Typography>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {navItems.map((item, idx) => {
                  const isActive = isItemActive(item)
                  const path = routeByItem[item]
                  return (
                    <ListItemButton
                      key={idx}
                      onClick={() => handleNavigate(path)}
                      selected={isActive}
                      sx={{
                        py: 1.4,
                        px: 1.4,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(2, 100, 126, 0.35)' : 'rgba(2, 100, 126, 0.08)',
                        backgroundColor: isActive ? 'rgba(2, 100, 126, 0.12)' : 'rgba(255,255,255,0.75)',
                        boxShadow: isActive ? '0 6px 16px rgba(2, 100, 126, 0.15)' : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(2, 100, 126, 0.1)',
                          transform: 'translateX(2px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? '#02647E' : '#667085', minWidth: 40 }}>
                        {menuIconsMap[item]}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          sx: {
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? '#02647E' : '#1f2937',
                            fontSize: 15
                          }
                        }}
                      />
                      {isActive && (
                        <Chip label="Actif" size="small" sx={{ height: 22, fontWeight: 700, fontSize: 10, bgcolor: '#02647E', color: 'white' }} />
                      )}
                      {!isActive && <ChevronRight sx={{ color: '#94a3b8', fontSize: 18 }} />}
                    </ListItemButton>
                  )
                })}
              </List>
            </Box>

            <Divider sx={{ mx: 2 }} />

            {/* Profile Section */}
            <Box sx={{ p: 1.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate('/profile')
                  handleMobileMenuClose()
                }}
                sx={{
                  py: 1.4,
                  px: 1.4,
                  borderRadius: 2.5,
                  border: '1px solid rgba(2, 100, 126, 0.12)',
                  bgcolor: 'rgba(255,255,255,0.75)',
                  '&:hover': {
                    backgroundColor: 'rgba(2, 100, 126, 0.08)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon sx={{ color: '#02647E', minWidth: 40 }}>
                  <Person sx={{ fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Mon profil"
                  secondary="Compte et préférences"
                  primaryTypographyProps={{ sx: { fontWeight: 700, fontSize: 15 } }}
                  secondaryTypographyProps={{ sx: { fontSize: 12 } }}
                />
              </ListItemButton>
            </Box>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}
