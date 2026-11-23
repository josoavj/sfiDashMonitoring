import React, { useEffect, useState } from 'react'
import { Box, Paper, Avatar, Typography, TextField, Button, CircularProgress, Snackbar, Alert, Grid, Card, CardHeader, CardContent, Divider, Chip, Stack, Switch, FormControlLabel, LinearProgress, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DevicesIcon from '@mui/icons-material/Devices'
import { useAuth } from '../context/auth-context'
import { authFetch } from '../utils/authFetch'

const isDev = import.meta.env.DEV

export default function ProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    weeklyReports: true,
    darkTheme: false,
    dataSharing: true,
  })
  const [lastSeenAt, setLastSeenAt] = useState('')

  function getAuthHeaders() {
    const token = localStorage.getItem('accessToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    async function load() {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/me'
        if (isDev) {
          console.log('[ProfilePage] Chargement depuis:', apiUrl)
        }
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include'
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (isDev) {
          console.log('[ProfilePage] Profil chargé:', data)
        }
        setProfile(data.user || data)
        if (data.preferences && typeof data.preferences === 'object') {
          setPreferences((prev) => ({ ...prev, ...data.preferences }))
        }
      } catch (err) {
        console.error('[ProfilePage] Erreur:', err)
        setProfile({ firstName: '', lastName: '', email: '', role: 'user', createdAt: new Date().toISOString() })
        setNotice({ severity: 'warning', message: 'Mode dégradé: impossible de charger le profil' })
      } finally {
        setLoading(false)
      }
    }

    setLastSeenAt(new Date().toLocaleString('fr-FR'))

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
      body.preferences = preferences
      const res = await authFetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'save failed')
      }
      const updated = await res.json()
      setProfile(updated.user || updated)
      if (updated.preferences && typeof updated.preferences === 'object') {
        setPreferences((prev) => ({ ...prev, ...updated.preferences }))
      }
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
      await logout()
      navigate('/auth/login', { replace: true })
    } catch (err) {
      setNotice({ severity: 'error', message: 'Impossible de se déconnecter' })
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, pt: { xs: 10, sm: 9, md: 8 }, minHeight: '100vh' }}><CircularProgress sx={{ color: '#02647E' }} /></Box>

  const fullName = ((profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '') || 'Utilisateur').trim()
  const initials = fullName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
  const createdDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  const isAdmin = profile?.role === 'admin'
  const passwordStrength = (() => {
    const p = password || ''
    if (!p) return { value: 0, label: 'Vide', color: '#BDBDBD' }
    let score = 0
    if (p.length >= 8) score += 35
    if (/[A-Z]/.test(p)) score += 20
    if (/[0-9]/.test(p)) score += 20
    if (/[^A-Za-z0-9]/.test(p)) score += 25
    if (score < 40) return { value: score, label: 'Faible', color: '#E05B5B' }
    if (score < 75) return { value: score, label: 'Moyen', color: '#F2C94C' }
    return { value: score, label: 'Fort', color: '#52B57D' }
  })()

  const preferenceMeta = {
    emailAlerts: {
      title: 'Alertes par Email',
      description: 'Notifications importantes envoyées par email'
    },
    weeklyReports: {
      title: 'Rapports Hebdomadaires',
      description: 'Résumé périodique de l\'activité réseau'
    },
    darkTheme: {
      title: 'Thème Sombre',
      description: 'Basculer vers une apparence sombre (préparation UI)'
    },
    dataSharing: {
      title: 'Partage de Données',
      description: 'Partage anonyme pour améliorer le service'
    }
  }
  const cardBaseSx = {
    borderRadius: 3,
    height: '100%',
    width: '100%',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      p: { xs: 1.25, sm: 2.5, md: 4 },
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
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: 2
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
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: 2
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={cardBaseSx}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={cardBaseSx}>
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
        <Card elevation={0} sx={{ ...cardBaseSx, mb: 3 }}>
          <CardHeader
            avatar={<Avatar sx={{ bgcolor: 'rgba(224, 91, 91, 0.15)', color: '#E05B5B' }}><LockIcon /></Avatar>}
            title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Changer le mot de passe</Typography>}
            subheader={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Optionnel - laissez vide pour conserver votre mot de passe actuel</Typography>}
            sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
          />
          <Divider />
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Force</Typography>
                    <Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 700 }}>{passwordStrength.label}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.value}
                    sx={{
                      height: 7,
                      borderRadius: 20,
                      bgcolor: 'rgba(0,0,0,0.08)',
                      '& .MuiLinearProgress-bar': { bgcolor: passwordStrength.color }
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Confirmer le mot de passe"
                  type="password"
                  fullWidth
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                {passwordConfirm ? (
                  <Typography variant="caption" sx={{ mt: 0.8, display: 'block', color: password === passwordConfirm ? '#52B57D' : '#E05B5B', fontWeight: 600 }}>
                    {password === passwordConfirm ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Preferences & Notifications Section */}
      <Card elevation={0} sx={{ ...cardBaseSx, mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'rgba(41, 186, 226, 0.15)', color: '#29BAE2' }}><NotificationsIcon /></Avatar>}
          title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Préférences & Notifications</Typography>}
          sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
        />
        <Divider />
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {Object.keys(preferenceMeta).map((key) => {
              const pref = preferenceMeta[key]
              const enabled = Boolean(preferences[key])
              return (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: { xs: 1.25, sm: 1.5 }, background: 'rgba(2, 100, 126, 0.03)', border: '1px solid rgba(2, 100, 126, 0.12)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#02647E', fontSize: '0.92rem' }}>
                    {pref.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem', display: 'block', mb: 1.2 }}>
                    {pref.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={enabled ? 'Activé' : 'Désactivé'}
                      size="small"
                      sx={{
                        bgcolor: enabled ? 'rgba(82, 181, 125, 0.15)' : 'rgba(153, 153, 153, 0.15)',
                        color: enabled ? '#52B57D' : '#666',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                    <FormControlLabel
                      label=""
                      sx={{ m: 0 }}
                      control={
                        <Switch
                          size="small"
                          checked={enabled}
                          onChange={(e) => {
                            const next = { ...preferences, [key]: e.target.checked }
                            setPreferences(next)
                            ;(async () => {
                              try {
                                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/me/preferences'
                                const res = await authFetch(apiUrl, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...getAuthHeaders()
                                  },
                                  body: JSON.stringify({ preferences: next })
                                })
                                if (!res.ok) throw new Error('Impossible de sauvegarder la préférence')
                                const payload = await res.json().catch(() => ({}))
                                if (payload.preferences) {
                                  setPreferences((prev) => ({ ...prev, ...payload.preferences }))
                                }
                                setNotice({ severity: 'info', message: `Préférence "${pref.title}" mise à jour` })
                              } catch (err) {
                                setPreferences(preferences)
                                setNotice({ severity: 'error', message: err.message || 'Échec de sauvegarde de la préférence' })
                              }
                            })()
                          }}
                        />
                      }
                    />
                  </Box>
                </Box>
              </Grid>
              )
            })}
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ ...cardBaseSx, mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'rgba(2, 100, 126, 0.15)', color: '#02647E' }}><DevicesIcon /></Avatar>}
          title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 600 }}>Activité & Session</Typography>}
          sx={{ pb: 1.5, p: { xs: 1.5, sm: 2 } }}
        />
        <Divider />
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(2,100,126,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#02647E', fontWeight: 700, display: 'block', mb: 0.5 }}>Dernière activité</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{lastSeenAt || 'N/A'}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(2,100,126,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#02647E', fontWeight: 700, display: 'block', mb: 0.5 }}>Token de session</Typography>
                <Chip
                  label={localStorage.getItem('accessToken') ? 'Valide' : 'Absent'}
                  size="small"
                  sx={{
                    bgcolor: localStorage.getItem('accessToken') ? 'rgba(82, 181, 125, 0.15)' : 'rgba(224,91,91,0.15)',
                    color: localStorage.getItem('accessToken') ? '#52B57D' : '#E05B5B',
                    fontWeight: 700
                  }}
                />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(2,100,126,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#02647E', fontWeight: 700, display: 'block', mb: 0.5 }}>Identifiant utilisateur</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{profile?.id || 'N/A'}</Typography>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(profile?.id || ''))
                        setNotice({ severity: 'success', message: 'ID utilisateur copié' })
                      } catch (err) {
                        setNotice({ severity: 'error', message: 'Impossible de copier l\'ID' })
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editMode && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1.5} 
          sx={{ justifyContent: 'flex-end', position: { xs: 'sticky', sm: 'static' }, bottom: { xs: 10, sm: 'auto' }, zIndex: { xs: 2, sm: 'auto' } }}
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
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' }, bgcolor: { xs: 'rgba(255,255,255,0.95)', sm: 'transparent' }, borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={saving}
            size="small"
            sx={{
              background: `linear-gradient(135deg, #02647E 0%, #72BDD1 100%)`,
              color: '#fff',
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2,
              boxShadow: '0 6px 16px rgba(2, 100, 126, 0.25)'
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
