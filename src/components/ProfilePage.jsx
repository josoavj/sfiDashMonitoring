import React, { useEffect, useState } from 'react'
import { Box, Paper, Avatar, Typography, TextField, Button, CircularProgress, Snackbar, Alert, Grid, Card, CardHeader, CardContent, Divider, Chip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import LogoutIcon from '@mui/icons-material/Logout'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import EmailIcon from '@mui/icons-material/Email'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VerifiedIcon from '@mui/icons-material/Verified'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/me'
        console.log('[ProfilePage] Chargement depuis:', apiUrl)
        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        console.log('[ProfilePage] Profil chargé:', data)
        setProfile(data.user || data)
      } catch (err) {
        console.error('[ProfilePage] Erreur:', err)
        setProfile({ firstName: '', lastName: '', email: '', role: 'user', createdAt: new Date().toISOString() })
        setNotice({ severity: 'warning', message: 'Mode dégradé: impossible de charger le profil' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/me'
      const body = { firstName: profile.firstName, lastName: profile.lastName, email: profile.email }
      if (password) {
        if (password !== passwordConfirm) throw new Error('Les mots de passe ne correspondent pas')
        if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères')
        body.password = password
      }
      const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'save failed')
      }
      const updated = await res.json()
      setProfile(updated.user || updated)
      setPassword('')
      setPasswordConfirm('')
      setEditMode(false)
      setNotice({ severity: 'success', message: 'Profil mis à jour avec succès' })
    } catch (err) {
      setNotice({ severity: 'error', message: err.message || 'Échec de la mise à jour' })
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/auth/signout'
      await fetch(apiUrl, { method: 'POST' })
      window.location.href = '/login'
    } catch (err) {
      setNotice({ severity: 'error', message: 'Impossible de se déconnecter' })
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, pt: { xs: 10, sm: 9 }, mt: { xs: 2, sm: 1 }, minHeight: '100vh' }}><CircularProgress sx={{ color: '#02647E' }} /></Box>

  const fullName = ((profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '') || 'Utilisateur').trim()
  const initials = fullName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
  const createdDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  const isAdmin = profile?.role === 'admin'

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 10, sm: 9, md: 8 }, mt: { xs: 2, sm: 1 }, minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        {/* Header Card with Profile Overview */}
        <Card sx={{ mb: 3, bgcolor: '#fff', boxShadow: '0 2px 12px rgba(2, 100, 126, 0.1)', border: `1px solid ${alpha('#02647E', 0.1)}` }}>
          <Box sx={{
            background: `linear-gradient(135deg, #02647E 0%, #72BDD1 100%)`,
            p: { xs: 2, sm: 3, md: 4 },
            color: 'white',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}>
            <Avatar sx={{
              width: { xs: 60, sm: 80, md: 100 },
              height: { xs: 60, sm: 80, md: 100 },
              bgcolor: alpha('#fff', 0.3),
              color: '#fff',
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 700,
              border: '3px solid rgba(255,255,255,0.5)',
              flexShrink: 0
            }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{fullName}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 16 }} />
                  {profile?.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={isAdmin ? <VerifiedIcon /> : undefined}
                  label={isAdmin ? 'Administrateur' : 'Utilisateur'}
                  size="small"
                  sx={{
                    bgcolor: isAdmin ? alpha('#E05B5B', 0.3) : alpha('#52B57D', 0.3),
                    color: isAdmin ? '#fff' : '#fff',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', width: { xs: '100%', sm: 'auto' } }}>
              {!editMode ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                    sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: alpha('#fff', 0.15) } }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={signOut}
                    sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: alpha('#fff', 0.15) } }}
                  >
                    Déconnexion
                  </Button>
                </>
              ) : null}
            </Box>
          </Box>
        </Card>

        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Left Column: Personal Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(2, 100, 126, 0.08)', border: `1px solid ${alpha('#02647E', 0.1)}` }}>
              <CardHeader
                avatar={<PersonIcon sx={{ color: '#02647E' }} />}
                title="Informations Personnelles"
                titleTypographyProps={{ variant: 'h6', sx: { color: '#02647E', fontWeight: 700 } }}
                sx={{ pb: 1.5 }}
              />
              <Divider />
              <CardContent>
                {editMode ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Prénom"
                      fullWidth
                      value={profile?.firstName || ''}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      label="Nom"
                      fullWidth
                      value={profile?.lastName || ''}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      label="Email"
                      fullWidth
                      type="email"
                      value={profile?.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>Prénom</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#02647E' }}>{profile?.firstName || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>Nom</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#02647E' }}>{profile?.lastName || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>Email</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#02647E', fontFamily: 'monospace' }}>{profile?.email || '—'}</Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Account Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(2, 100, 126, 0.08)', border: `1px solid ${alpha('#02647E', 0.1)}` }}>
              <CardHeader
                avatar={<LockIcon sx={{ color: '#02647E' }} />}
                title="Compte et Sécurité"
                titleTypographyProps={{ variant: 'h6', sx: { color: '#02647E', fontWeight: 700 } }}
                sx={{ pb: 1.5 }}
              />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>Rôle</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#02647E' }}>
                        {isAdmin ? 'Administrateur' : 'Utilisateur Standard'}
                      </Typography>
                      <Chip
                        label={isAdmin ? 'PRIVILÉGIÉ' : 'STANDARD'}
                        size="small"
                        sx={{
                          bgcolor: isAdmin ? alpha('#E05B5B', 0.15) : alpha('#72BDD1', 0.15),
                          color: isAdmin ? '#E05B5B' : '#02647E',
                          fontWeight: 700,
                          fontSize: '0.65rem'
                        }}
                      />
                    </Box>
                  </Box>
                  <Divider />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: '#72BDD1' }} />
                      <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Membre depuis</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#02647E' }}>{createdDate}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>ID Utilisateur</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.8rem' }}>{profile?.id || 'N/A'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Security Section - Password Change */}
        {editMode && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(2, 100, 126, 0.08)', border: `1px solid ${alpha('#02647E', 0.1)}`, mb: 3 }}>
            <CardHeader
              avatar={<LockIcon sx={{ color: '#02647E' }} />}
              title="Changer le mot de passe"
              titleTypographyProps={{ variant: 'h6', sx: { color: '#02647E', fontWeight: 700 } }}
              subheader="Optionnel - laissez vide pour conserver votre mot de passe actuel"
              sx={{ pb: 1.5 }}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nouveau mot de passe"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="Min. 6 caractères"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Confirmer le mot de passe"
                    type="password"
                    fullWidth
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {editMode && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => {
                setEditMode(false)
                setPassword('')
                setPasswordConfirm('')
              }}
              disabled={saving}
              sx={{ color: '#666', borderColor: '#ccc' }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={save}
              disabled={saving}
              sx={{
                background: `linear-gradient(135deg, #02647E 0%, #72BDD1 100%)`,
                color: '#fff',
                fontWeight: 600
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </Box>
        )}

        {/* Snackbar Notifications */}
        <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
          {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
        </Snackbar>
      </Box>
    </Box>
  )
}
