import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Divider,
  Chip
} from '@mui/material'
import { useNotifications } from '../context/NotificationContext'

export function CriticalAlertDialog({ open, onClose, title, message, severity = 'error', actions = [] }) {
  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'error': return '#d32f2f'
      case 'warning': return '#f57c00'
      default: return '#1976d2'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${getSeverityColor(severity)}`
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity={severity}>
            {message}
          </Alert>
          {actions.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Actions recommandées:
              </Typography>
              <Stack spacing={1}>
                {actions.map((action, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      • {action}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
