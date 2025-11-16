import React, { useEffect, useState } from 'react'
import { Box, Card, CardHeader, CardContent, Button, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DataGrid } from '@mui/x-data-grid'
import { useNotifications } from '../context/NotificationContext'

export default function UserManagement() {
  const { addNotification } = useNotifications()
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
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title="Gestion des utilisateurs"
          subheader="Lister, supprimer et rafraîchir les comptes"
          action={<Box>
            <Button startIcon={<RefreshIcon />} onClick={loadUsers} disabled={loading}>Rafraîchir</Button>
          </Box>}
        />
        <CardContent>
          {loading ? <CircularProgress /> : (
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid rows={rows} columns={columns} pageSize={10} rowsPerPageOptions={[10,25,50]} disableSelectionOnClick />
            </div>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
