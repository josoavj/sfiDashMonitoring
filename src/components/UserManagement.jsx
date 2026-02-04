import React, { useEffect, useState } from 'react'
import { Box, Card, CardHeader, CardContent, Button, IconButton, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DataGrid } from '@mui/x-data-grid'
import { useNotifications } from '../context/NotificationContext'
import { useTheme, useMediaQuery } from '@mui/material'

export default function UserManagement() {
  const { addNotification } = useNotifications()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch('/api/users', { headers })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      // Expect data.users or array
      const list = Array.isArray(data) ? data : data.users || []
      setRows(list.map(u => ({ id: u.id || u._id || u.username, username: u.username, email: u.email, createdAt: u.createdAt })))
    } catch (err) {
      console.warn('loadUsers error', err)
      const errorMsg = 'Impossible de charger la liste des utilisateurs (vérifiez votre authentification)'
      setNotice({ severity: 'warning', message: errorMsg })
      addNotification(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function deleteUser(id) {
    if (!confirm('Confirmer la suppression de cet utilisateur ?')) return
    try {
      const token = localStorage.getItem('accessToken')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('delete failed')
      const successMsg = 'Utilisateur supprimé'
      setNotice({ severity: 'success', message: successMsg })
      addNotification(successMsg, 'success')
      loadUsers()
    } catch (err) {
      console.error(err)
      const errorMsg = 'Échec suppression'
      setNotice({ severity: 'error', message: errorMsg })
      addNotification(errorMsg, 'error')
    }
  }

  const columns = [
    { field: 'username', headerName: 'Utilisateur', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'createdAt', headerName: 'Créé le', width: 180 },
    {
      field: 'actions', headerName: 'Actions', width: 120, renderCell: (params) => {
        return (
          <Box>
            <IconButton color="error" size="small" onClick={() => deleteUser(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }
    }
  ]

  return (
    <Box sx={{ width: '100%' }}>
      <Card elevation={1}>
        <CardHeader
          title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 600 }}>Gestion des utilisateurs</Typography>}
          subheader={<Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, mt: 0.5 }}>Lister, supprimer et rafraîchir les comptes</Typography>}
          action={
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={loadUsers} 
              disabled={loading}
              size="small"
              variant="outlined"
            >
              Rafraîchir
            </Button>
          }
          sx={{
            '& .MuiCardHeader-root': { p: { xs: 1.5, sm: 2 } }
          }}
        />
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {isMobile ? (
                // Mobile: Stack Cards
                <Stack spacing={1.5}>
                  {rows.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                      Aucun utilisateur
                    </Typography>
                  ) : (
                    rows.map((row) => (
                      <Card key={row.id} variant="outlined" sx={{ p: 1.5, background: 'rgba(2, 100, 126, 0.03)' }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-word' }}>
                                {row.username}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mt: 0.25, wordBreak: 'break-word' }}>
                                {row.email}
                              </Typography>
                            </Box>
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => deleteUser(row.id)}
                              sx={{ flexShrink: 0 }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Créé le: {row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                          </Typography>
                        </Stack>
                      </Card>
                    ))
                  )}
                </Stack>
              ) : (
                // Desktop: DataGrid
                <Box sx={{ height: { xs: 300, sm: 400, md: 520 }, width: '100%' }}>
                  <DataGrid 
                    rows={rows} 
                    columns={columns} 
                    pageSize={10} 
                    rowsPerPageOptions={[10, 25, 50]} 
                    disableSelectionOnClick
                    density="compact"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
