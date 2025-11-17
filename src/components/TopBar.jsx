import React, { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { AccountCircle } from '@mui/icons-material'
import { VisualizationMenu } from './custom-elements/VisualisationMenu'
import { NotificationButton } from './NotificationButton'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNav } from '../context/NavContext'

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null)
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
    <AppBar position="fixed" sx={{ backgroundColor: 'primary.main', color: 'common.white', boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="img" src="/images/sfi_logo_primary.png" sx={{ mx: 6, width: 55 }} />

        <Box sx={{ ml: 8 }}>
          <Stack direction="row" spacing={8}>
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
                      fontSize: 16,
                      textTransform: 'none',
                      color: 'common.white',
                      fontWeight: isActive ? 700 : 400,
                      position: 'relative',
                      pb: 1,
                      pt: 1,
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

        <Box sx={{ ml: 'auto', mr: 4.5 }}>
          <NotificationButton />

          <IconButton sx={{ color: 'common.white' }} onClick={() => navigate('/profile')} title="Mon profil">
            <AccountCircle sx={{ fontSize: 35 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
