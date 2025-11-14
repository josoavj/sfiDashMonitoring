import React, { useEffect, useState } from 'react'
import { Box, Card, CardHeader, CardContent, TextField, Button, CircularProgress, Snackbar, Alert } from '@mui/material'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('no /api/me')
        const data = await res.json()
        setProfile(data.user || data)
      } catch (err) {
        // fallback: minimal placeholder
        setProfile({ username: 'invité', email: '' })
        setNotice({ severity: 'info', message: 'Impossible de charger le profil (/api/me absent) — mode dégradé' })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
      if (!res.ok) throw new Error('save failed')
      setNotice({ severity: 'success', message: 'Profil mis à jour' })
    } catch (err) {
      setNotice({ severity: 'error', message: 'Échec enregistrement du profil' })
    } finally { setSaving(false) }
  }

  if (loading) return <CircularProgress />

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader title="Mon profil" subheader="Informations du compte" />
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <TextField label="Utilisateur" value={profile?.username || ''} fullWidth sx={{ mb: 2 }} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            <TextField label="Email" value={profile?.email || ''} fullWidth sx={{ mb: 2 }} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
