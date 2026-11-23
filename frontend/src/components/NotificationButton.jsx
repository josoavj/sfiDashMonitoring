import React, { useState } from 'react'
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Badge,
  Stack,
  Button,
  Chip,
  Divider,
  Paper
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material'
import { useNotifications } from '../context/NotificationContext'
import { alpha } from '@mui/material/styles'

export function NotificationButton() {
  const { notifications, removeNotification, clearAll } = useNotifications()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleOpen = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const open = Boolean(anchorEl)

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon sx={{ fontSize: 18, color: '#d32f2f' }} />
      case 'warning':
        return <WarningIcon sx={{ fontSize: 18, color: '#f57c00' }} />
      case 'success':
        return <SuccessIcon sx={{ fontSize: 18, color: '#388e3c' }} />
      default:
        return <InfoIcon sx={{ fontSize: 18, color: '#1976d2' }} />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return '#ffebee'
      case 'warning':
        return '#fff3e0'
      case 'success':
        return '#e8f5e9'
      default:
        return '#e3f2fd'
    }
  }

  const errorCount = notifications.filter(n => n.severity === 'error').length
  const warningCount = notifications.filter(n => n.severity === 'warning').length

  const formatTime = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return timestamp.toLocaleDateString('fr-FR')
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ color: 'common.white' }}
        title="Notifications"
      >
        <Badge
          badgeContent={notifications.length}
          color={warningCount > 0 ? 'warning' : errorCount > 0 ? 'error' : 'primary'}
          overlap="circular"
        >
          <InfoIcon sx={{ fontSize: 24 }} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper
          sx={{
            width: 380,
            maxHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa'
          }}
          elevation={3}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              {notifications.length > 0 && (
                <Chip
                  label={notifications.length}
                  size="small"
                  color={warningCount > 0 ? 'warning' : errorCount > 0 ? 'error' : 'default'}
                  variant="filled"
                />
              )}
            </Box>
            <Box>
              {notifications.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    clearAll()
                    handleClose()
                  }}
                  title="Effacer tout"
                >
                  <ClearAllIcon sx={{ fontSize: 20 }} />
                </IconButton>
              )}
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Contenu */}
          {notifications.length === 0 ? (
            <Box
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                textAlign: 'center'
              }}
            >
              <InfoIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography variant="body2">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List
              sx={{
                overflow: 'auto',
                flex: 1,
                '&::-webkit-scrollbar': {
                  width: 8
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: 4
                }
              }}
            >
              {notifications.map((notif, idx) => (
                <Box key={notif.id}>
                  <ListItem
                    sx={{
                      backgroundColor: getSeverityColor(notif.severity),
                      mb: 0.5,
                      mx: 1,
                      borderRadius: 1,
                      border: `1px solid ${alpha('#000', 0.05)}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                      py: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'flex-start', pt: 0.5 }}>
                      {getSeverityIcon(notif.severity)}
                      <Box sx={{ flex: 1 }}>
                        <ListItemText
                          primary={notif.message}
                          secondary={formatTime(notif.timestamp)}
                          primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500 } }}
                          secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.7rem' } }}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeNotification(notif.id)}
                      sx={{ mt: -0.5, mr: -0.5 }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </Box>
              ))}
            </List>
          )}

          {/* Footer Stats */}
          {notifications.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.8rem'
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  {errorCount}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                  Erreurs
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#f57c00' }}>
                  {warningCount}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                  Avertissements
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  {notifications.filter(n => n.severity === 'info').length}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                  Infos
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#388e3c' }}>
                  {notifications.filter(n => n.severity === 'success').length}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                  Succès
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  )
}
