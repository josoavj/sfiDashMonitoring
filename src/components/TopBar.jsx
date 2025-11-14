import React, { useRef, useState } from 'react'
import { AppBar, Toolbar, Box, Stack, Button, IconButton } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { AccountCircle, Notifications } from '@mui/icons-material'
import { VisualizationMenu } from './custom-elements/VisualisationMenu'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const toolbarRef = useRef(null)
  const navigate = useNavigate()
  const navItems = ['Tableau de bord', 'Rapports', 'Alertes', 'Paramètres']

  const handleMenuOpen = () => setAnchorEl(toolbarRef.current)
  const handleMenuClose = () => setAnchorEl(null)

  return (
    <AppBar position="fixed">
      <Toolbar ref={toolbarRef} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="img" src="/images/sfi_logo_primary.png" sx={{ mx: 6, width: 55 }} />

        <Box sx={{ ml: 8 }}>
          <Stack direction="row" spacing={8}>
            {navItems.map((item, idx) => (
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
                  sx={{ fontSize: 16, textTransform: 'none' }}>
                  {item}

                  {item === 'Tableau de bord' && (
                    <VisualizationMenu anchorEl={anchorEl} handleMenuClose={handleMenuClose} setSubItemActive={() => {}} />
                  )}
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ ml: 'auto', mr: 4.5 }}>
          <IconButton sx={{ color: 'secondary.lighter' }}>
            <Notifications />
          </IconButton>

          <IconButton sx={{ color: 'secondary.lighter' }} onClick={() => navigate('/profile')} title="Mon profil">
            <AccountCircle sx={{ fontSize: 35 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
