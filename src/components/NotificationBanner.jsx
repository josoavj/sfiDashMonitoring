import React from 'react'
import { Alert, Box, Button, Collapse, Stack } from '@mui/material'
import { useNotifications } from '../context/NotificationContext'

export function NotificationBanner() {
  const { notifications, removeNotification } = useNotifications()

  // Afficher seulement les erreurs critiques
  const criticalErrors = notifications.filter(n => n.severity === 'error').slice(0, 3)

  if (criticalErrors.length === 0) return null

  return (
    <Box sx={{ position: 'sticky', top: 64, zIndex: 1000 }}>
      <Stack spacing={1} sx={{ p: 2, backgroundColor: '#fff3e0' }}>
        {criticalErrors.map(notification => (
          <Collapse key={notification.id} in={true}>
            <Alert
              severity="error"
              onClose={() => removeNotification(notification.id)}
              sx={{
                backgroundColor: '#ffebee',
                borderLeft: '4px solid #d32f2f'
              }}
            >
              {notification.message}
            </Alert>
          </Collapse>
        ))}
      </Stack>
    </Box>
  )
}
