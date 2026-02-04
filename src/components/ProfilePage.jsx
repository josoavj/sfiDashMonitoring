import React, { useEffect, useState } from 'react'
import { Box, Paper, Avatar, Typography, TextField, Button, CircularProgress, Snackbar, Alert, Grid, Card, CardHeader, CardContent, Divider, Chip, Stack } from '@mui/material'
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
import NotificationsIcon from '@mui/icons-material/Notifications'
import SecurityIcon from '@mui/icons-material/Security'

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
      // Effacer les données stockées (matcher AuthContext)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('auth:user')
      // Redirection vers la page de connexion
      window.location.href = '/auth/login'
    } catch (err) {
      setNotice({ severity: 'error', message: 'Impossible de se déconnecter' })
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, pt: { xs: 10, sm: 9, md: 8 }, minHeight: '100vh' }}><CircularProgress sx={{ color: '#02647E' }} /></Box>

  const fullName = ((profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '') || 'Utilisateur').trim()
  const initials = fullName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
  const createdDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  const isAdmin = profile?.role === 'admin'

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      p: { xs: 1, sm: 2.5, md: 4 },
      pt: { xs: 12, sm: 11, md: 10 }
    }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%' }}>
      {/* Header with Gradient Background */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 3,
          background: `linear-gradient(135deg, #02647E 0%, #72BDD1 100%)`,
          borderRadius: 2,
          color: 'white',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 3 }
        }}
      >
        {/* Avatar */}
        <Avatar sx={{
          width: { xs: 60, sm: 80, md: 100 },
          height: { xs: 60, sm: 80, md: 100 },
          bgcolor: 'rgba(255,255,255,0.25)',
          color: '#fff',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          fontWeight: 700,
          border: '3px solid rgba(255,255,255,0.4)',
          flexShrink: 0
        }}>
          {initials}
        </Avatar>

        {/* Profile Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 1, 
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              wordBreak: 'break-word'
            }}
          >
            {fullName}
          </Typography>
          
          <Stack direction="column" spacing={0.75} sx={{ mb: 1.5 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.7,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                wordBreak: 'break-all'
              }}
            >
              <EmailIcon sx={{ fontSize: { xs: 16, sm: 18 }, flexShrink: 0 }} />
              {profile?.email}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.7,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: { xs: 16, sm: 18 }, flexShrink: 0 }} />
              Depuis {createdDate}
            </Typography>
          </Stack>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              icon={isAdmin ? <VerifiedIcon /> : undefined}
              label={isAdmin ? 'Administrateur' : 'Utilisateur'}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            />
            <Chip
              label={isAdmin ? 'PRIVILÉGIÉ' : 'STANDARD'}
              size="small"
              sx={{
                bgcolor: isAdmin ? 'rgba(224, 91, 91, 0.3)' : 'rgba(114, 189, 209, 0.3)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1} 
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          {!editMode ? (
            <>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: '#fff', 
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Modifier
              </Button>
              <Button
                variant="contained"
                startIcon={<LogoutIcon />}
                onClick={signOut}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(224, 91, 91, 0.3)', 
                  color: '#fff', 
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(224, 91, 91, 0.5)' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Déconnexion
              </Button>
            </>
          ) : null}
        </Stack>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, height: '100%', width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'rgba(2, 100, 126, 0.15)', color: '#02647E' }}><PersonIcon /></Avatar>}
              title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Informations Personnelles</Typography>}
              sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              {editMode ? (
                <Stack spacing={2}>
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
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Prénom</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#02647E', fontSize: '0.95rem' }}>{profile?.firstName || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Nom</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#02647E', fontSize: '0.95rem' }}>{profile?.lastName || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#02647E', fontSize: '0.9rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{profile?.email || '—'}</Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Account & Security */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, height: '100%', width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'rgba(82, 181, 125, 0.15)', color: '#52B57D' }}><SecurityIcon /></Avatar>}
              title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Sécurité & Compte</Typography>}
              sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Rôle</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#02647E', fontSize: '0.95rem' }}>
                      {isAdmin ? 'Administrateur' : 'Utilisateur Standard'}
                    </Typography>
                    <Chip
                      label={isAdmin ? 'PRIVILÉGIÉ' : 'STANDARD'}
                      size="small"
                      sx={{
                        bgcolor: isAdmin ? 'rgba(224, 91, 91, 0.15)' : 'rgba(114, 189, 209, 0.15)',
                        color: isAdmin ? '#E05B5B' : '#02647E',
                        fontWeight: 700,
                        fontSize: '0.65rem'
                      }}
                    />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>ID Utilisateur</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.75rem', wordBreak: 'break-all' }}>{profile?.id || 'N/A'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Section */}
      {editMode && (
        <Card elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
          <CardHeader
            avatar={<Avatar sx={{ bgcolor: 'rgba(224, 91, 91, 0.15)', color: '#E05B5B' }}><LockIcon /></Avatar>}
            title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Changer le mot de passe</Typography>}
            subheader={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Optionnel - laissez vide pour conserver votre mot de passe actuel</Typography>}
            sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
          />
          <Divider />
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
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

      {/* Preferences & Notifications Section */}
      <Card elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'rgba(41, 186, 226, 0.15)', color: '#29BAE2' }}><NotificationsIcon /></Avatar>}
          title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Préférences & Notifications</Typography>}
          sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
        />
        <Divider />
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, background: 'rgba(2, 100, 126, 0.03)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#02647E', fontSize: '0.9rem' }}>📧 Alertes par Email</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mb: 1 }}>Notifications importantes par email</Typography>
                <Chip label="Activé" size="small" sx={{ bgcolor: 'rgba(82, 181, 125, 0.15)', color: '#52B57D', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, background: 'rgba(2, 100, 126, 0.03)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#02647E', fontSize: '0.9rem' }}>📊 Rapports Hebdomadaires</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mb: 1 }}>Résumé de l'activité réseau</Typography>
                <Chip label="Activé" size="small" sx={{ bgcolor: 'rgba(82, 181, 125, 0.15)', color: '#52B57D', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, background: 'rgba(2, 100, 126, 0.03)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#02647E', fontSize: '0.9rem' }}>🌙 Thème Sombre</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mb: 1 }}>Interface sombre (bientôt)</Typography>
                <Chip label="Désactivé" size="small" sx={{ bgcolor: 'rgba(153, 153, 153, 0.15)', color: '#666', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, background: 'rgba(2, 100, 126, 0.03)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#02647E', fontSize: '0.9rem' }}>📈 Partage de Données</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mb: 1 }}>Amélioration du service</Typography>
                <Chip label="Autorisé" size="small" sx={{ bgcolor: 'rgba(82, 181, 125, 0.15)', color: '#52B57D', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editMode && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1.5} 
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => {
              setEditMode(false)
              setPassword('')
              setPasswordConfirm('')
            }}
            disabled={saving}
            fullWidth={{ xs: true, sm: false }}
            size="small"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={saving}
            fullWidth={{ xs: true, sm: false }}
            size="small"
            sx={{
              background: `linear-gradient(135deg, #02647E 0%, #72BDD1 100%)`,
              color: '#fff',
              fontWeight: 600
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Stack>
      )}

      {/* Snackbar Notifications */}
      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
      </Box>
    </Box>
  )
}
