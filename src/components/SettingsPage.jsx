import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Tabs,
  Tab,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
  Paper,
} from '@mui/material'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RestoreIcon from '@mui/icons-material/Restore'
import UserManagement from './UserManagement'

const defaultSettings = {
  apiBase: '',
  pollMs: 2000,
  websocketEnabled: true,
  devMode: false,
  token: { accessMs: 15 * 60 * 1000, refreshDays: 7 },
  notifications: { email: false, socket: true },
  logLevel: 'info',
}

function TabPanel({ children, value, index }) {
  if (value !== index) return null
  return <Box sx={{ pt: 2 }}>{children}</Box>
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('no endpoint')
        const data = await res.json()
        setSettings(prev => ({ ...prev, ...data }))
      } catch (err) {
        const local = localStorage.getItem('app:settings')
        if (local) setSettings(JSON.parse(local))
        setNotice({ severity: 'info', message: 'Chargement via fallback (localStorage) — endpoint /api/settings absent' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onChange = (path, value) => {
    setSettings(prev => {
      const next = { ...prev }
      const parts = path.split('.')
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] }
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = value
      return next
    })
  }

  async function saveSection() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      if (!res.ok) throw new Error('save failed')
      setNotice({ severity: 'success', message: 'Paramètres enregistrés' })
    } catch (err) {
      localStorage.setItem('app:settings', JSON.stringify(settings))
      setNotice({ severity: 'warning', message: 'Enregistré localement (fallback). Configurez /api/settings pour persistance.' })
    } finally {
      setSaving(false)
    }
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sfi_settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importSettings(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        setSettings(prev => ({ ...prev, ...parsed }))
        setNotice({ severity: 'success', message: 'Paramètres importés' })
      } catch (err) {
        setNotice({ severity: 'error', message: 'Fichier invalide' })
      }
    }
    reader.readAsText(file)
  }

  function resetDefaults() {
    setSettings(defaultSettings)
    setNotice({ severity: 'info', message: 'Paramètres réinitialisés aux valeurs par défaut (non sauvegardés)' })
  }

  const logLevels = useMemo(() => ['debug', 'info', 'warn', 'error'], [])

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      p: { xs: 1.5, sm: 2.5, md: 4 },
      pt: { xs: 12, sm: 11, md: 10 }
    }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
              Paramètres
            </Typography>
            <Typography sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' } }}>
              Configuration de l'application et options avancées
            </Typography>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Tabs */}
          <Card elevation={1} sx={{ mb: 3, overflow: 'auto' }}>
            <Tabs 
              value={tab} 
              onChange={(e, v) => setTab(v)} 
              textColor="primary" 
              indicatorColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  minHeight: { xs: 48, sm: 56 },
                  px: { xs: 1, sm: 2 }
                }
              }}
            >
              <Tab label="Général" />
              <Tab label="API / Réseau" />
              <Tab label="Authentification" />
              <Tab label="Notifications" />
              <Tab label="Avancé" />
            </Tabs>
          </Card>

          {/* TAB 1: Général */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {/* Formulaire */}
              <Grid item xs={12} md={8}>
                <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Configuration générale</Typography>
                  <Stack spacing={2}>
                    <TextField 
                      label="API Base URL" 
                      value={settings.apiBase || ''} 
                      onChange={(e) => onChange('apiBase', e.target.value)} 
                      fullWidth 
                      size="small"
                      variant="outlined"
                    />
                    <TextField 
                      label="Poll interval (ms)" 
                      value={settings.pollMs || ''} 
                      onChange={(e) => onChange('pollMs', Number(e.target.value) || 0)} 
                      type="number"
                      fullWidth 
                      size="small"
                    />
                    <FormControlLabel 
                      control={<Switch checked={!!settings.websocketEnabled} onChange={(e) => onChange('websocketEnabled', e.target.checked)} />} 
                      label="WebSocket activé" 
                      sx={{ my: 1 }}
                    />
                    <FormControlLabel 
                      control={<Switch checked={!!settings.devMode} onChange={(e) => onChange('devMode', e.target.checked)} />} 
                      label="Mode développement" 
                      sx={{ my: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={saveSection} 
                        disabled={saving}
                        size="small"
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />} 
                        onClick={exportSettings}
                        size="small"
                      >
                        Exporter
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<RestoreIcon />} 
                        onClick={resetDefaults}
                        size="small"
                      >
                        Réinitialiser
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Help Card */}
              <Grid item xs={12} md={4}>
                <Card elevation={1} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, background: 'rgba(2, 100, 126, 0.05)' }}>
                  <Typography variant="h6" sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>💡 Aide rapide</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, lineHeight: 1.6 }}>
                    Configurez l'URL de l'API, l'intervalle de polling, activez/désactivez les WebSockets et activez le mode développement pour le debug.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 2: API / Réseau */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Configuration réseau</Typography>
                  <Stack spacing={2}>
                    <TextField 
                      label="API Base URL" 
                      value={settings.apiBase || ''} 
                      onChange={(e) => onChange('apiBase', e.target.value)} 
                      fullWidth 
                      size="small"
                    />
                    <TextField 
                      label="Timeout HTTP (ms)" 
                      value={settings.httpTimeout || 10000} 
                      onChange={(e) => onChange('httpTimeout', Number(e.target.value) || 0)} 
                      type="number"
                      fullWidth 
                      size="small"
                    />
                    <TextField 
                      label="Port Backend" 
                      value={settings.backendPort || ''} 
                      onChange={(e) => onChange('backendPort', e.target.value)}
                      fullWidth 
                      size="small"
                    />
                    <Button 
                      variant="contained" 
                      onClick={saveSection} 
                      disabled={saving}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, background: 'rgba(2, 100, 126, 0.05)' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>📤 Import/Export</Typography>
                  <Stack spacing={1.5}>
                    <Button 
                      component="label" 
                      variant="outlined"
                      startIcon={<FileUploadIcon />}
                      fullWidth
                      size="small"
                    >
                      Importer
                      <input hidden type="file" accept="application/json" onChange={(e) => importSettings(e.target.files[0])} />
                    </Button>
                    <Button 
                      variant="outlined"
                      startIcon={<DownloadIcon />} 
                      onClick={exportSettings}
                      fullWidth
                      size="small"
                    >
                      Exporter
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 3: Authentification */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>🔐 Tokens & Sécurité</Typography>
                  <Stack spacing={2}>
                    <TextField 
                      label="Access token (ms)" 
                      value={settings.token?.accessMs || ''} 
                      onChange={(e) => onChange('token.accessMs', Number(e.target.value) || 0)} 
                      type="number" 
                      fullWidth 
                      size="small"
                    />
                    <TextField 
                      label="Refresh token (days)" 
                      value={settings.token?.refreshDays || ''} 
                      onChange={(e) => onChange('token.refreshDays', Number(e.target.value) || 0)} 
                      type="number"
                      fullWidth 
                      size="small"
                    />
                    <FormControlLabel 
                      control={<Switch checked={!!settings.require2fa} onChange={(e) => onChange('require2fa', e.target.checked)} />} 
                      label="Exiger 2FA"
                    />
                    <Button 
                      variant="contained" 
                      onClick={saveSection} 
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, background: 'rgba(224, 91, 91, 0.05)' }}>
                  <Typography variant="h6" sx={{ mb: 1.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>ℹ️ Recommandations</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, lineHeight: 1.6 }}>
                    Configurez les politiques de mot de passe, rotation des tokens et refresh sécurisé via cookies HttpOnly. Voir <strong>Deployment.md</strong> pour les recommandations.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 4: Notifications */}
          <TabPanel value={tab} index={3}>
            <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 }, maxWidth: 600 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>🔔 Notifications</Typography>
              <Stack spacing={2}>
                <FormControlLabel 
                  control={<Switch checked={!!settings.notifications?.email} onChange={(e) => onChange('notifications.email', e.target.checked)} />} 
                  label="Notifications par email"
                />
                <FormControlLabel 
                  control={<Switch checked={!!settings.notifications?.socket} onChange={(e) => onChange('notifications.socket', e.target.checked)} />} 
                  label="Notifications en temps réel (Socket)"
                />
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, color: 'text.secondary' }}>
                  Configurez les intégrations d'alerte (Slack, Email, PagerDuty) via le backend.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={saveSection} 
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Stack>
            </Card>
          </TabPanel>

          {/* TAB 5: Avancé */}
          <TabPanel value={tab} index={4}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>⚙️ Options avancées</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>Log Level</Typography>
                      <Select 
                        value={settings.logLevel || 'info'} 
                        onChange={(e) => onChange('logLevel', e.target.value)} 
                        fullWidth 
                        size="small"
                      >
                        {logLevels.map(l => <MenuItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</MenuItem>)}
                      </Select>
                    </Box>
                    <FormControlLabel 
                      control={<Switch checked={!!settings.devMode} onChange={(e) => onChange('devMode', e.target.checked)} />} 
                      label="Mode développement"
                    />
                    <Button 
                      variant="contained" 
                      onClick={saveSection} 
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, background: 'rgba(242, 201, 76, 0.05)' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>🔧 Maintenance</Typography>
                  <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.85rem' }, color: 'text.secondary' }}>
                    Actions de maintenance: vider cache, forcer refresh des agrégats, activer le mode débogage.
                  </Typography>
                  <Stack spacing={1}>
                    <Button variant="outlined" size="small" fullWidth>Vider le cache</Button>
                    <Button variant="outlined" size="small" fullWidth>Forcer refresh</Button>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* User Management */}
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Card elevation={1} sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}>👥 Gestion des utilisateurs</Typography>
              <UserManagement />
            </Card>
          </Box>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
      </Box>
    </Box>
  )
}
