import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Card,
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
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import DownloadIcon from '@mui/icons-material/Download'
import RestoreIcon from '@mui/icons-material/Restore'
import UserManagement from './UserManagement'
import { authFetch } from '../utils/authFetch'

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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [tab, setTab] = useState(0)
  const [persistenceMode, setPersistenceMode] = useState('api')
  const [lastSavedAt, setLastSavedAt] = useState('')
  const showInlineSectionActions = !isMobile

  const settingsTabs = [
    { key: 'general', label: 'Général', short: 'Général' },
    { key: 'api', label: 'API / Réseau', short: 'API' },
    { key: 'auth', label: 'Authentification', short: 'Auth' },
    { key: 'notifications', label: 'Notifications', short: 'Notif' },
    { key: 'advanced', label: 'Avancé', short: 'Avancé' },
  ]

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch('/api/settings')
        if (!res.ok) throw new Error('no endpoint')
        const data = await res.json()
        setSettings(prev => ({ ...prev, ...data }))
      } catch (err) {
        const local = localStorage.getItem('app:settings')
        if (local) setSettings(JSON.parse(local))
        setPersistenceMode('local')
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
      const res = await authFetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      if (!res.ok) throw new Error('save failed')
      setPersistenceMode('api')
      setLastSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setNotice({ severity: 'success', message: 'Paramètres enregistrés' })
    } catch (err) {
      localStorage.setItem('app:settings', JSON.stringify(settings))
      setPersistenceMode('local')
      setLastSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
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
    if (!file) return
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
      pt: { xs: 12, sm: 11, md: 10 },
      pb: { xs: 11, sm: 4, md: 4 }
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
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1.25, sm: 2 }}>
          <Box sx={{ flex: 1, width: '100%' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
              Paramètres
            </Typography>
            <Typography sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' } }}>
              Configuration de l'application et options avancées
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' } }}>
            <Chip
              size="small"
              label={persistenceMode === 'api' ? 'Persistance API' : 'Persistance locale'}
              sx={{
                bgcolor: persistenceMode === 'api' ? 'rgba(82,181,125,0.22)' : 'rgba(242,201,76,0.24)',
                color: 'white',
                fontWeight: 700,
              }}
            />
            <Chip
              size="small"
              label={`Polling ${settings.pollMs || 0}ms`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#02647E', 0.04) }}>
            <Typography fontSize={12} color="text.secondary">Mode de persistance</Typography>
            <Typography fontWeight={700} color={persistenceMode === 'api' ? '#02647E' : '#9E7D20'}>
              {persistenceMode === 'api' ? 'Backend / API' : 'LocalStorage'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#52B57D', 0.08) }}>
            <Typography fontSize={12} color="text.secondary">WebSocket</Typography>
            <Typography fontWeight={700} color={settings.websocketEnabled ? '#52B57D' : '#E05B5B'}>
              {settings.websocketEnabled ? 'Activé' : 'Désactivé'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#F2C94C', 0.14) }}>
            <Typography fontSize={12} color="text.secondary">Dernière sauvegarde</Typography>
            <Typography fontWeight={700} color="#9E7D20">{lastSavedAt || 'Non effectuée'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Action row */}
          <Paper elevation={0} sx={{ mb: 2, p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Ajustez vos préférences puis enregistrez en un clic.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiButton-root': {
                    width: { xs: '100%', sm: 'auto' },
                    minWidth: { sm: 126 },
                  },
                }}
              >
                <Button variant="contained" onClick={saveSection} disabled={saving} size="small">
                  {saving ? 'Enregistrement...' : 'Enregistrer tout'}
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportSettings} size="small">Exporter</Button>
                <Button variant="outlined" startIcon={<RestoreIcon />} onClick={resetDefaults} size="small">Réinitialiser</Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Tabs */}
          <Card elevation={1} sx={{ mb: 3, overflow: 'auto', borderRadius: 2 }}>
            <Tabs 
              value={tab} 
              onChange={(e, v) => setTab(v)} 
              aria-label="Navigation des paramètres"
              textColor="primary" 
              indicatorColor="primary"
              variant={isMobile ? 'fullWidth' : 'scrollable'}
              scrollButtons={isMobile ? false : 'auto'}
              sx={{
                px: { xs: 0.25, sm: 0 },
                '& .MuiTab-root': {
                  fontSize: { xs: '0.74rem', sm: '0.9rem', md: '1rem' },
                  minHeight: { xs: 44, sm: 56 },
                  px: { xs: 0.4, sm: 2 },
                  minWidth: { xs: 0, sm: 120 },
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: { xs: 1.5, sm: 0 },
                  mx: { xs: 0.25, sm: 0 },
                  my: { xs: 0.5, sm: 0 },
                }
              }}
            >
              {settingsTabs.map((item, idx) => (
                <Tab
                  key={item.key}
                  id={`settings-tab-${item.key}`}
                  aria-controls={`settings-panel-${item.key}`}
                  aria-label={item.label}
                  label={isMobile ? (item.key === 'advanced' ? 'Adv.' : item.short) : item.label}
                />
              ))}
            </Tabs>
          </Card>

          {/* TAB 1: Général */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {/* Formulaire */}
              <Grid size={{ xs: 12, md: 8 }}>
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
                    {showInlineSectionActions ? (
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{
                          pt: 2,
                          width: '100%',
                          '& .MuiButton-root': {
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: { sm: 116 },
                          },
                        }}
                      >
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
                      </Stack>
                    ) : null}
                  </Stack>
                </Card>
              </Grid>

              {/* Help Card */}
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
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
                    {showInlineSectionActions ? (
                      <Button 
                        variant="contained" 
                        onClick={saveSection} 
                        disabled={saving}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    ) : null}
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
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
                      <input hidden type="file" accept="application/json" onChange={(e) => importSettings(e.target.files?.[0])} />
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
              <Grid size={{ xs: 12, md: 6 }}>
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
                    {showInlineSectionActions ? (
                      <Button 
                        variant="contained" 
                        onClick={saveSection} 
                        disabled={saving}
                        fullWidth
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    ) : null}
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
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
                {showInlineSectionActions ? (
                  <Button 
                    variant="contained" 
                    onClick={saveSection} 
                    disabled={saving}
                    fullWidth
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                ) : null}
              </Stack>
            </Card>
          </TabPanel>

          {/* TAB 5: Avancé */}
          <TabPanel value={tab} index={4}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
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
                    {showInlineSectionActions ? (
                      <Button 
                        variant="contained" 
                        onClick={saveSection} 
                        disabled={saving}
                        fullWidth
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    ) : null}
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>👥 Gestion des utilisateurs</Typography>
                <Typography variant="caption" color="text.secondary">Administration des comptes et rôles</Typography>
              </Stack>
              <UserManagement />
            </Card>
          </Box>

          {isMobile ? (
            <Paper
              elevation={6}
              sx={{
                position: 'sticky',
                bottom: 10,
                mt: 2,
                p: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.92)',
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(6px)',
                zIndex: 5,
              }}
            >
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="contained" onClick={saveSection} disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button fullWidth variant="outlined" onClick={exportSettings} startIcon={<DownloadIcon />}>
                  Export
                </Button>
              </Stack>
            </Paper>
          ) : null}
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
