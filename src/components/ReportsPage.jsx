import React, { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import {
  FileDownload,
  Assessment,
  TrendingUp,
  Speed,
  Cloud,
  Refresh,
  Info,
  Download,
  Close,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedTime, setSelectedTime] = useState(new Date().toISOString().slice(0, 16))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [filterType, setFilterType] = useState('all') // all, ip, service

  // Génération du rapport
  async function generateReport() {
    setGenerating(true)
    setError(null)
    try {
      const to = new Date(selectedTime)
      const from = new Date()
      from.setHours(6, 30, 0, 0)

      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
          limit: 20,
          includeServices: true,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setReportData({
          ...data,
          generatedAt: new Date().toLocaleString('fr-FR'),
          timePeriod: `06:30 - ${to.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        })
        setSuccess('Rapport généré avec succès')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || 'Erreur lors de la génération du rapport')
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setGenerating(false)
    }
  }

  // Téléchargement du rapport en CSV
  function downloadCSV() {
    if (!reportData) return

    let csv = 'Rapport de Consommation Réseau\n'
    csv += `Généré le: ${reportData.generatedAt}\n`
    csv += `Période: ${reportData.timePeriod}\n\n`

    // Top 20 IP
    csv += 'TOP 20 CONSOMMATEURS\n'
    csv += 'Rang,IP,Consommation (MB),Bande Passante (MB/s),Connexions,Pourcentage\n'
    reportData.topIPs?.forEach((ip, idx) => {
      csv += `${idx + 1},"${ip.ip}",${(ip.bytes / 1024 / 1024).toFixed(2)},${(ip.bandwidth / 1024 / 1024).toFixed(3)},${ip.connections},${(ip.percentage || 0).toFixed(2)}%\n`
    })

    csv += '\n\nTOP SERVICES\n'
    csv += 'Rang,Service,Consommation (MB),Bande Passante (MB/s),Nombre de connexions\n'
    reportData.topServices?.forEach((svc, idx) => {
      csv += `${idx + 1},"${svc.name}",${(svc.bytes / 1024 / 1024).toFixed(2)},${(svc.bandwidth / 1024 / 1024).toFixed(3)},${svc.connections}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Téléchargement du rapport en JSON
  function downloadJSON() {
    if (!reportData) return

    const dataToDownload = {
      metadata: {
        generatedAt: reportData.generatedAt,
        timePeriod: reportData.timePeriod,
        version: '1.0',
      },
      topIPs: reportData.topIPs,
      topServices: reportData.topServices,
      summary: reportData.summary,
    }

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getConsumptionColor = (percentage) => {
    if (percentage > 10) return '#E05B5B'
    if (percentage > 5) return '#F2C94C'
    return '#52B57D'
  }

  const formatBytes = (bytes) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  const formatBandwidth = (bytes) => {
    const mbs = bytes / 1024 / 1024
    return `${mbs.toFixed(3)} MB/s`
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        p: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 10, sm: 9, md: 8 },
        mt: { xs: 2, sm: 1 },
      }}
    >
      <Box sx={{ maxWidth: '1800px', mx: 'auto' }}>
        {/* Header */}
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
            <Assessment sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Rapports
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                Générez et téléchargez des rapports détaillés de consommation réseau
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Panneau de génération */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Refresh sx={{ color: 'primary.main' }} />
                Générer un Rapport
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Jusqu'à :
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={generating}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    La période commence à 06:30
                  </Typography>
                </Box>

                <Alert severity="info" icon={<Info sx={{ fontSize: 18 }} />}>
                  <Typography variant="caption">
                    Le rapport inclura les <strong>Top 20 consommateurs</strong> et les <strong>services les plus utilisés</strong>
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  size="large"
                  onClick={generateReport}
                  disabled={generating || !selectedTime}
                  fullWidth
                  sx={{ fontWeight: 600 }}
                >
                  {generating ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Assessment sx={{ mr: 1 }} />
                      Générer le Rapport
                    </>
                  )}
                </Button>

                {success && <Alert severity="success">{success}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </Paper>

            {/* Actions de téléchargement */}
            {reportData && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Download sx={{ color: 'success.main' }} />
                  Télécharger
                </Typography>

                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FileDownload />}
                    onClick={downloadCSV}
                    sx={{ textTransform: 'none' }}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FileDownload />}
                    onClick={downloadJSON}
                    sx={{ textTransform: 'none' }}
                  >
                    JSON
                  </Button>
                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<Info />}
                    onClick={() => setPreviewOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Aperçu
                  </Button>
                </Stack>
              </Paper>
            )}
          </Grid>

          {/* Résumé et détails */}
          <Grid item xs={12} md={8}>
            {!reportData ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
                <Assessment sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  Aucun rapport généré
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sélectionnez une date et cliquez sur "Générer le Rapport" pour commencer
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {/* Résumé */}
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Résumé
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: alpha('#02647E', 0.1),
                          borderRadius: 1,
                          border: `1px solid ${alpha('#02647E', 0.2)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Période du rapport
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {reportData.timePeriod}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: alpha('#52B57D', 0.1),
                          borderRadius: 1,
                          border: `1px solid ${alpha('#52B57D', 0.2)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Total consommé
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatBytes(reportData.summary?.totalBytes || 0)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: alpha('#29BBE2', 0.1),
                          borderRadius: 1,
                          border: `1px solid ${alpha('#29BBE2', 0.2)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Bande passante moyenne
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatBandwidth(reportData.summary?.avgBandwidth || 0)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: alpha('#F2C94C', 0.1),
                          borderRadius: 1,
                          border: `1px solid ${alpha('#F2C94C', 0.2)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Nombre de connexions
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {reportData.summary?.totalConnections || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Top 20 IP */}
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUp sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Top 20 Consommateurs
                    </Typography>
                    <Chip label={reportData.topIPs?.length || 0} size="small" />
                  </Box>

                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#02647E', 0.1) }}>
                          <TableCell sx={{ fontWeight: 700 }}>Rang</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Adresse IP</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Consommation
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Bande Passante
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Connexions
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            %
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.topIPs?.map((ip, idx) => (
                          <TableRow key={ip.ip} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ fontWeight: 600 }}>#{idx + 1}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{ip.ip}</TableCell>
                            <TableCell align="right">{formatBytes(ip.bytes)}</TableCell>
                            <TableCell align="right">{formatBandwidth(ip.bandwidth)}</TableCell>
                            <TableCell align="right">{ip.connections}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${(ip.percentage || 0).toFixed(2)}%`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getConsumptionColor(ip.percentage || 0), 0.2),
                                  color: getConsumptionColor(ip.percentage || 0),
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Top Services */}
                {reportData.topServices && reportData.topServices.length > 0 && (
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Cloud sx={{ color: 'success.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Services les Plus Utilisés
                      </Typography>
                      <Chip label={reportData.topServices.length} size="small" color="success" />
                    </Box>

                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha('#52B57D', 0.1) }}>
                            <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              Consommation
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              Bande Passante
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              Connexions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.topServices.map((svc, idx) => (
                            <TableRow key={svc.name} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontWeight: 500 }}>{svc.name}</TableCell>
                              <TableCell align="right">{formatBytes(svc.bytes)}</TableCell>
                              <TableCell align="right">{formatBandwidth(svc.bandwidth)}</TableCell>
                              <TableCell align="right">{svc.connections}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {/* Informations du rapport */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#029384', 0.05) }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info sx={{ fontSize: 16 }} />
                    Rapport généré le {reportData.generatedAt}
                  </Typography>
                </Paper>
              </Stack>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Dialog d'aperçu */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment />
            Aperçu du Rapport
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} size="small" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {reportData && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Informations du rapport
                </Typography>
                <Typography variant="body2">
                  <strong>Généré le :</strong> {reportData.generatedAt}
                </Typography>
                <Typography variant="body2">
                  <strong>Période :</strong> {reportData.timePeriod}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Contenu inclus
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">✓ Top 20 consommateurs avec détails</Typography>
                  <Typography variant="body2">✓ Bande passante par IP</Typography>
                  <Typography variant="body2">✓ Services les plus utilisés</Typography>
                  <Typography variant="body2">✓ Statistiques de connexions</Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Formats disponibles
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">📄 CSV - Compatibilité maximale (Excel, Google Sheets)</Typography>
                  <Typography variant="body2">📋 JSON - Format structuré pour intégration</Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
