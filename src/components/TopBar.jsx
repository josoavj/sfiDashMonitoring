import React, { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { AccountCircle, Notifications } from '@mui/icons-material'
import { VisualizationMenu } from './custom-elements/VisualisationMenu'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNav } from '../context/NavContext'

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const toolbarRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { subItemActive } = useNav()
  const navItems = ['Tableau de bord', 'Rapports', 'Alertes', 'Paramètres']

  const handleMenuOpen = () => setAnchorEl(toolbarRef.current)
  const handleMenuClose = () => setAnchorEl(null)

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'primary.main', color: 'common.white', boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="img" src="/images/sfi_logo_primary.png" sx={{ mx: 6, width: 55 }} />

        <Box sx={{ ml: 8 }}>
          <Stack direction="row" spacing={8}>
            {navItems.map((item, idx) => {
              const isActive = item === 'Tableau de bord' ? !!subItemActive : (item === 'Paramètres' ? location.pathname.startsWith('/settings') : location.pathname.startsWith('/visualization') && !subItemActive)
              return (
                <Box key={idx}>
                  <Button
                    disableRipple
                    onClick={() => {
                      if (item === 'Tableau de bord') {
                        anchorEl ? handleMenuClose() : handleMenuOpen()
                        navigate('/visualization')
                      } else if (item === 'Paramètres') {
                        navigate('/settings')
                      } else {
                        // other pages
                        navigate('/visualization')
                      }
                    }}
                    endIcon={item === 'Tableau de bord' ? anchorEl ? <KeyboardArrowUp /> : <KeyboardArrowDown /> : null}
                      sx={{
                        fontSize: 16,
                        textTransform: 'none',
                        color: 'common.white',
                        fontWeight: isActive ? 700 : 400,
                        borderBottom: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                        pb: isActive ? '6px' : '8px'
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
          <IconButton sx={{ color: 'common.white' }} title="Notifications">
            <Notifications />
          </IconButton>

          <IconButton sx={{ color: 'common.white' }} onClick={() => navigate('/profile')} title="Mon profil">
            <AccountCircle sx={{ fontSize: 35 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
