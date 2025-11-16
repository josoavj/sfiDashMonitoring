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
      p: { xs: 2, sm: 3, md: 4 },
      pt: { xs: 10, sm: 9, md: 8 }, 
      mt: { xs: 2, sm: 1 } 
    }}>
      <Box sx={{ maxWidth: '1800px', mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Paramètres
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              Configuration de l'application et options avancées
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Card>
        <CardContent>
          {loading ? (
            <CircularProgress />
          ) : (
            <Box>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary">
                <Tab label="Général" />
                <Tab label="API / Réseau" />
                <Tab label="Authentification" />
                <Tab label="Notifications" />
                <Tab label="Avancé" />
              </Tabs>

              <TabPanel value={tab} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Stack spacing={2}>
                      <TextField label="API Base URL" value={settings.apiBase || ''} onChange={(e) => onChange('apiBase', e.target.value)} fullWidth />
                      <TextField label="Poll interval (ms)" value={settings.pollMs || ''} onChange={(e) => onChange('pollMs', Number(e.target.value) || 0)} type="number" />
                      <FormControlLabel control={<Switch checked={!!settings.websocketEnabled} onChange={(e) => onChange('websocketEnabled', e.target.checked)} />} label="WebSocket activé" />
                      <FormControlLabel control={<Switch checked={!!settings.devMode} onChange={(e) => onChange('devMode', e.target.checked)} />} label="Mode développement" />
                      <Box>
                        <Button variant="contained" onClick={saveSection} disabled={saving} sx={{ mr: 1 }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportSettings} sx={{ mr: 1 }}>Exporter</Button>
                        <Button variant="outlined" startIcon={<RestoreIcon />} onClick={resetDefaults}>Réinitialiser</Button>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6">Aide rapide</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>Ici vous pouvez configurer l'URL de l'API, l'intervalle de polling, activer/désactiver les WebSockets et basculer le mode dev.</Typography>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tab} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="API Base URL" value={settings.apiBase || ''} onChange={(e) => onChange('apiBase', e.target.value)} fullWidth />
                    <TextField label="Timeout HTTP (ms)" value={settings.httpTimeout || 10000} onChange={(e) => onChange('httpTimeout', Number(e.target.value) || 0)} type="number" sx={{ mt: 2 }} />
                    <TextField label="Port Backend" value={settings.backendPort || ''} onChange={(e) => onChange('backendPort', e.target.value)} sx={{ mt: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1">Export / Import</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Button component="label" startIcon={<FileUploadIcon />}>Importer<input hidden type="file" accept="application/json" onChange={(e) => importSettings(e.target.files[0])} /></Button>
                        <Button startIcon={<DownloadIcon />} sx={{ ml: 1 }} onClick={exportSettings}>Exporter</Button>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={saveSection} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </Box>
              </TabPanel>

              <TabPanel value={tab} index={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Tokens</Typography>
                    <TextField label="Access token (ms)" value={settings.token?.accessMs || ''} onChange={(e) => onChange('token.accessMs', Number(e.target.value) || 0)} type="number" fullWidth sx={{ mt: 1 }} />
                    <TextField label="Refresh token (days)" value={settings.token?.refreshDays || ''} onChange={(e) => onChange('token.refreshDays', Number(e.target.value) || 0)} type="number" sx={{ mt: 1 }} fullWidth />
                    <FormControlLabel control={<Switch checked={!!settings.require2fa} onChange={(e) => onChange('require2fa', e.target.checked)} />} label="Exiger 2FA" sx={{ mt: 1 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1">Sécurité</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>Configurer les politiques de mot de passe, rotation des tokens et refresh sécurisé via cookies HttpOnly (voir Deployment.md pour recommandations).</Typography>
                    </Card>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={saveSection} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </Box>
              </TabPanel>

              <TabPanel value={tab} index={3}>
                <Stack spacing={2}>
                  <FormControlLabel control={<Switch checked={!!settings.notifications?.email} onChange={(e) => onChange('notifications.email', e.target.checked)} />} label="Notifications par email" />
                  <FormControlLabel control={<Switch checked={!!settings.notifications?.socket} onChange={(e) => onChange('notifications.socket', e.target.checked)} />} label="Notifications en temps réel (Socket)" />
                  <Typography variant="body2">Configurer les intégrations d'alerte (Slack, Email, PagerDuty) via le backend.</Typography>
                  <Box>
                    <Button variant="contained" onClick={saveSection} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                  </Box>
                </Stack>
              </TabPanel>

              <TabPanel value={tab} index={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Options avancées</Typography>
                    <Select value={settings.logLevel || 'info'} onChange={(e) => onChange('logLevel', e.target.value)} fullWidth sx={{ mt: 1 }}>
                      {logLevels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </Select>
                    <FormControlLabel control={<Switch checked={!!settings.devMode} onChange={(e) => onChange('devMode', e.target.checked)} />} label="Mode développement" sx={{ mt: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1">Maintenance</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>Actions de maintenance: vider cache, forcer refresh des agrégats, activer le mode débogage.</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Button variant="outlined" sx={{ mr: 1 }}>Vider le cache</Button>
                        <Button variant="outlined">Forcer refresh</Button>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={saveSection} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </Box>
              </TabPanel>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>Gestion des utilisateurs</Typography>
        <UserManagement />
      </Box>

      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice ? <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert> : null}
      </Snackbar>
      </Box>
    </Box>
  )
}
