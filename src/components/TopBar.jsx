import React, { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton, Drawer, List, ListItem, ListItemButton, Divider, ListItemIcon, ListItemText, Typography, Paper, Avatar } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Menu, Dashboard, Public, Explore, Description, Warning, Settings, Person, Close } from '@mui/icons-material'
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

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const toolbarRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { subItemActive } = useNav()
  const navItems = ['Tableau de bord', 'IPs', 'Exploration', 'Rapports', 'Alertes', 'Paramètres']

  // Ne pas afficher la TopBar sur les pages d'authentification
  const isAuthPage = location.pathname === '/auth/login' || location.pathname === '/auth/signup'
  if (isAuthPage) return null

  const handleMenuOpen = () => setAnchorEl(toolbarRef.current)
  const handleMenuClose = () => setAnchorEl(null)
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
    <AppBar position="fixed" sx={{ backgroundColor: 'primary.main', color: 'common.white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: 'none' }}>
      <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: { xs: 60, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
        {/* Logo */}
        <Box component="img" src="/images/sfi_logo_primary.png" sx={{ width: { xs: 38, sm: 50, md: 55 }, flexShrink: 0 }} />

        {/* Menu Desktop - Centré */}
        <Box sx={{ ml: { xs: 1, sm: 4, md: 8 }, display: { xs: 'none', sm: 'block' }, flex: 1 }}>
          <Stack direction="row" spacing={{ xs: 2, sm: 4, md: 8 }} justifyContent="center">
            {navItems.map((item, idx) => {
              const isActive = isItemActive(item)
              return (
                <Box key={idx}>
                  <Button
                    disableRipple
                    onClick={() => {
                      if (item === 'Tableau de bord') {
                        anchorEl ? handleMenuClose() : handleMenuOpen()
                        navigate('/visualization')
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
                      fontSize: { xs: 12, sm: 14, md: 16 },
                      textTransform: 'none',
                      color: 'common.white',
                      fontWeight: isActive ? 700 : 400,
                      position: 'relative',
                      pb: 1,
                      pt: 1,
                      px: { xs: 0.5, sm: 1 },
                      transition: 'all 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: isActive ? '100%' : '0%',
                        height: '3px',
                        backgroundColor: 'white',
                        transition: 'width 0.3s ease',
                        borderRadius: '2px 2px 0 0'
                      },
                      '&:hover::after': {
                        width: '100%'
                      }
                    }}>
                    {item}

                    {item === 'Tableau de bord' && (
                      <VisualizationMenu anchorEl={anchorEl} handleMenuClose={handleMenuClose} setSubItemActive={() => {}} />
                    )}
                  </Button>
                </Box>
              )
            })}
          </Stack>
        </Box>

        {/* Actions à droite */}
        <Box sx={{ ml: { xs: 'auto', sm: 2, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5, md: 2 } }}>
          {/* Notifications - Visible partout */}
          <NotificationButton />

          {/* Profil - Visible partout */}
          <IconButton 
            sx={{ 
              color: 'common.white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
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
              display: { xs: 'flex', sm: 'none' },
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
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
              width: 300,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
            }
          }}
        >
          {/* Header Drawer */}
          <Box sx={{ 
            p: 2.5, 
            background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Navigation</Typography>
            <IconButton 
              onClick={handleMobileMenuClose}
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Menu Items */}
          <List sx={{ p: 0 }}>
            {navItems.map((item, idx) => {
              const isActive = isItemActive(item)
              return (
                <ListItemButton
                  key={idx}
                  onClick={() => {
                    if (item === 'Tableau de bord') {
                      handleNavigate('/visualization')
                    } else if (item === 'IPs') {
                      handleNavigate('/ip-view')
                    } else if (item === 'Exploration') {
                      handleNavigate('/exploration')
                    } else if (item === 'Rapports') {
                      handleNavigate('/reports')
                    } else if (item === 'Paramètres') {
                      handleNavigate('/settings')
                    } else if (item === 'Alertes') {
                      handleNavigate('/alerts')
                    }
                  }}
                  selected={isActive}
                  sx={{
                    py: 2,
                    px: 2.5,
                    borderLeft: isActive ? '4px solid #02647E' : 'none',
                    backgroundColor: isActive ? 'rgba(2, 100, 126, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(2, 100, 126, 0.12)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#02647E' : '#666', minWidth: 40 }}>
                    {menuIconsMap[item]}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#02647E' : 'inherit'
                      }
                    }}
                  />
                </ListItemButton>
              )
            })}
          </List>

          <Divider sx={{ my: 1 }} />

          {/* Profile Section */}
          <List sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => {
                navigate('/profile')
                handleMobileMenuClose()
              }}
              sx={{
                py: 2,
                px: 2.5,
                '&:hover': {
                  backgroundColor: 'rgba(2, 100, 126, 0.12)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <ListItemIcon sx={{ color: '#666', minWidth: 40 }}>
                <Person sx={{ fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Mon profil"
                primaryTypographyProps={{
                  sx: { fontWeight: 500 }
                }}
              />
            </ListItemButton>
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}
