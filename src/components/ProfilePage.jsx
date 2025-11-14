import React, { useEffect, useState } from 'react'
import { Box, Grid, Paper, Avatar, Typography, TextField, Button, CircularProgress, Snackbar, Alert, IconButton } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import SaveIcon from '@mui/icons-material/Save'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/me')
        if (!res.ok) throw new Error('no /api/me')
        const data = await res.json()
        setProfile(data.user || data)
      } catch (err) {
        // fallback: minimal placeholder
        setProfile({ firstName: '', lastName: '', email: '' })
        setNotice({ severity: 'info', message: 'Impossible de charger le profil — mode dégradé' })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const body = { firstName: profile.firstName, lastName: profile.lastName, email: profile.email }
      if (password) {
        if (password !== passwordConfirm) throw new Error('Les mots de passe ne correspondent pas')
        body.password = password
      }
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'save failed')
      }
      const updated = await res.json()
      setProfile(updated.user || updated)
      setPassword('')
      setPasswordConfirm('')
      setNotice({ severity: 'success', message: 'Profil mis à jour' })
    } catch (err) {
      setNotice({ severity: 'error', message: err.message || 'Échec enregistrement du profil' })
    } finally { setSaving(false) }
  }

  async function signOut() {
    try {
      await fetch((import.meta.env.VITE_API_URL || '') + '/auth/signout', { method: 'POST' })
      // best-effort: reload to clear state
      window.location.href = '/login'
    } catch (err) {
      setNotice({ severity: 'error', message: 'Impossible de se déconnecter' })
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, pt: { xs: 10, sm: 9 }, mt: { xs: 2, sm: 1 } }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 3, pt: { xs: 10, sm: 9 }, mt: { xs: 2, sm: 1 } }}>
      <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto' }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 72, height: 72 }}>{(profile?.firstName || 'U').charAt(0).toUpperCase()}</Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h6">{(profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '') || 'Utilisateur'}</Typography>
            <Typography color="text.secondary">{profile?.email || ''}</Typography>
            <Typography color="text.secondary" fontSize={12}>{profile?.role ? `Rôle: ${profile.role}` : ''}</Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={signOut}>Déconnexion</Button>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Prénom" fullWidth value={profile?.firstName || ''} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} sx={{ mb: 2 }} />
              <TextField label="Nom" fullWidth value={profile?.lastName || ''} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} sx={{ mb: 2 }} />
              <TextField label="Email" fullWidth value={profile?.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Sécurité</Typography>
              <TextField label="Nouveau mot de passe" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Confirmer mot de passe" type="password" fullWidth value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} sx={{ mb: 2 }} />
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer les changements'}</Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
