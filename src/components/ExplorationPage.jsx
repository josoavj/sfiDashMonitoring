import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material'
import { Search as SearchIcon, DownloadForExcel as DownloadIcon, FilterList as FilterIcon } from 'lucide-react'
import { useTheme } from '@mui/material/styles'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ExplorationPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // État de la recherche
  const [filters, setFilters] = useState({
    sourceIp: '',
    destinationIp: '',
    sourcePort: '',
    destinationPort: '14', // Port 14 par défaut
    protocol: '',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const [searchMode, setSearchMode] = useState('advanced') // 'simple' ou 'advanced'
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalResults, setTotalResults] = useState(0)
  const [stats, setStats] = useState({
    totalBytes: 0,
    avgBytes: 0,
    uniqueServices: 0,
    packetCount: 0
  })
  const [pagination, setPagination] = useState({ from: 0, size: 50 })

  // Construire la requête de recherche
  const buildQuery = () => {
    const conditions = []

    if (filters.sourceIp) {
      conditions.push(`source.ip:"${filters.sourceIp}"`)
    }
    if (filters.destinationIp) {
      conditions.push(`destination.ip:"${filters.destinationIp}"`)
    }
    if (filters.sourcePort) {
      conditions.push(`source.port:${filters.sourcePort}`)
    }
    if (filters.destinationPort) {
      conditions.push(`destination.port:${filters.destinationPort}`)
    }
    if (filters.protocol) {
      conditions.push(`network.protocol:"${filters.protocol}"`)
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '*'
  }

  // Effectuer la recherche
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const query = buildQuery()
      const startDate = new Date(`${filters.startDate}T00:00:00Z`).getTime()
      const endDate = new Date(`${filters.endDate}T23:59:59Z`).getTime()

      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query,
          from: pagination.from,
          size: pagination.size,
          timeRange: {
            from: startDate,
            to: endDate
          },
          sortField: '@timestamp',
          sortOrder: 'desc'
        })
      })

      if (!response.ok) throw new Error('Erreur lors de la recherche')

      const data = await response.json()
      setTotalResults(data.total)
      setResults(data.hits.map(hit => hit._source))

      // Calculer les stats
      if (data.hits.length > 0) {
        const totalBytes = data.hits.reduce((sum, hit) => sum + (hit._source.network?.bytes || 0), 0)
        const avgBytes = totalBytes / data.hits.length
        const services = new Set(data.hits.map(hit => hit._source['network.application'] || 'Unknown'))

        setStats({
          totalBytes,
          avgBytes: Math.round(avgBytes),
          uniqueServices: services.size,
          packetCount: data.hits.length
        })
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche')
      console.error('Erreur recherche:', err)
    } finally {
      setLoading(false)
    }
  }

  // Gestionnaire de changement de filtre
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Réinitialiser les filtres
  const handleReset = () => {
    setFilters({
      sourceIp: '',
      destinationIp: '',
      sourcePort: '',
      destinationPort: '14',
      protocol: '',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    })
    setResults([])
    setStats({ totalBytes: 0, avgBytes: 0, uniqueServices: 0, packetCount: 0 })
    setPagination({ from: 0, size: 50 })
  }

  // Formater les bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Formater la date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🔍 Exploration
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Recherche personnalisée dans les données Elasticsearch
        </Typography>
      </Box>

      {/* Panneau de recherche */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Filtres de recherche
        </Typography>

        {/* Mode de recherche */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Mode de recherche</InputLabel>
            <Select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              label="Mode de recherche"
            >
              <MenuItem value="advanced">Avancé</MenuItem>
              <MenuItem value="simple">Simple</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Grille des filtres */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* IP Source */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="IP Source"
              placeholder="ex: 192.168.1.1"
              value={filters.sourceIp}
              onChange={(e) => handleFilterChange('sourceIp', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* IP Destination */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="IP Destination"
              placeholder="ex: 10.0.0.1"
              value={filters.destinationIp}
              onChange={(e) => handleFilterChange('destinationIp', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* Port Source */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Port Source"
              placeholder="ex: 443"
              type="number"
              value={filters.sourcePort}
              onChange={(e) => handleFilterChange('sourcePort', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* Port Destination */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Port Destination"
              placeholder="ex: 14"
              type="number"
              value={filters.destinationPort}
              onChange={(e) => handleFilterChange('destinationPort', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* Protocole */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Protocole</InputLabel>
              <Select
                value={filters.protocol}
                onChange={(e) => handleFilterChange('protocol', e.target.value)}
                label="Protocole"
              >
                <MenuItem value="">-- Tous --</MenuItem>
                <MenuItem value="tcp">TCP</MenuItem>
                <MenuItem value="udp">UDP</MenuItem>
                <MenuItem value="icmp">ICMP</MenuItem>
                <MenuItem value="ipv4">IPv4</MenuItem>
                <MenuItem value="ipv6">IPv6</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Plage de dates */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Date de début"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Date de fin"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
        </Grid>

        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              color: theme.palette.warning.main,
              borderColor: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: `${theme.palette.warning.main}20`
              }
            }}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<SearchIcon size={18} />}
            onClick={handleSearch}
            disabled={loading}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                boxShadow: `0 8px 24px ${theme.palette.primary.main}40`
              }
            }}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </Box>
      </Paper>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiques */}
      {results.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de paquets
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {stats.packetCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de données
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatBytes(stats.totalBytes)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Moy. par paquet
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatBytes(stats.avgBytes)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Services uniques
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {stats.uniqueServices}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tableau des résultats */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && results.length > 0 && (
        <Paper sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2">
              {totalResults} résultats trouvés (affichage {pagination.from + 1}-{Math.min(pagination.from + pagination.size, totalResults)})
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>IP Source</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>IP Destination</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ports</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Données (bytes)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Protocole</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {formatDate(row['@timestamp'])}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row['source.ip'] || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row['destination.ip'] || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {row['source.port']} → {row['destination.port']}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatBytes(row['network.bytes'] || 0)}
                        size="small"
                        color={row['network.bytes'] > 1000000 ? 'error' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row['network.application'] || 'Unknown'}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row['network.protocol']?.toUpperCase() || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: row['network.protocol'] === 'tcp' ? '#2196F3' : '#FF9800',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              disabled={pagination.from === 0}
              onClick={() => setPagination(prev => ({ ...prev, from: Math.max(0, prev.from - prev.size) }))}
            >
              Précédent
            </Button>
            <Button
              size="small"
              disabled={pagination.from + pagination.size >= totalResults}
              onClick={() => setPagination(prev => ({ ...prev, from: prev.from + prev.size }))}
            >
              Suivant
            </Button>
          </Box>
        </Paper>
      )}

      {!loading && results.length === 0 && totalResults === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
          <FilterIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography color="textSecondary">
            Aucun résultat. Modifiez vos filtres et relancez la recherche.
          </Typography>
        </Paper>
      )}
    </Container>
  )
}
