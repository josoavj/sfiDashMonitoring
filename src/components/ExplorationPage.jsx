import React, { useState, useEffect } from 'react'
import {
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
import { Search as SearchIcon, Download as DownloadIcon, FilterList as FilterIconMUI, Explore as ExploreIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { PieChart, BarChart } from '@mui/x-charts'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ExplorationPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // État de la recherche
  const [filters, setFilters] = useState({
    sourceIp: '',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '00:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '23:59'
  })

  const [searchMode, setSearchMode] = useState('advanced') // 'simple', 'advanced', ou 'iprange'
  const [ipRangeStart, setIpRangeStart] = useState('')
  const [ipRangeEnd, setIpRangeEnd] = useState('')
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

  // Normaliser les données Elasticsearch (les champs peuvent être des arrays ou des valeurs)
  const normalizeEsField = (value) => {
    if (Array.isArray(value)) {
      return value[0]; // Prendre le premier élément si c'est un array
    }
    return value;
  }

  // Flatten un objet imbriqué
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    for (const [key, value] of Object.entries(obj || {})) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = normalizeEsField(value);
      }
    }
    return flattened;
  }

  // Normaliser un document complet
  const normalizeEsDocument = (doc) => {
    if (!doc) return {};
    const normalized = flattenObject(doc);
    
    // Mapper les champs d'application/service (Fortigate utilise fortinet.firewall.dstinetsvc ou rule.name)
    if (!normalized['network.application']) {
      normalized['network.application'] = 
        normalized['fortinet.firewall.dstinetsvc'] ||
        normalized['rule.name'] ||
        'Unknown';
    }
    
    return normalized;
  }

  // Effectuer la recherche
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    // Reset pagination quand on fait une nouvelle recherche
    setPagination({ from: 0, size: 50 })
    await performSearch(0, 50)
  }

  // Effectuer la recherche avec les paramètres donnés
  const performSearch = async (from = 0, size = 50) => {
    setLoading(true)
    setError(null)

    try {
      // Convertir les dates WITHOUT le Z (pas en UTC, mais en heure locale)
      // Car les données Elasticsearch sont en heure locale du serveur
      const startDate = new Date(`${filters.startDate}T${filters.startTime}:00`).getTime()
      const endDate = new Date(`${filters.endDate}T${filters.endTime}:59`).getTime()

      let endpoint = `${BACKEND_URL}/api/exploration/search`
      let body = {}

      if (searchMode === 'iprange' && ipRangeStart && ipRangeEnd) {
        // Recherche par plage d'IPs
        endpoint = `${BACKEND_URL}/api/exploration/ip-range`
        body = {
          startIp: ipRangeStart,
          endIp: ipRangeEnd,
          field: 'source.ip',
          from,
          size,
          timeRange: {
            from: startDate,
            to: endDate
          }
        }
      } else {
        // Recherche avancée standard - Filtrer par IP source principalement
        body = {
          timeRange: {
            from: startDate,
            to: endDate
          },
          from,
          size,
          sortField: '@timestamp',
          sortOrder: 'desc'
        }
        
        // Ajouter les filtres seulement s'ils sont remplis
        if (filters.sourceIp && filters.sourceIp.trim()) {
          body.sourceIp = filters.sourceIp.trim()
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      console.log('📤 Request dates:', { 
        startDate: new Date(body.timeRange.from).toISOString(),
        endDate: new Date(body.timeRange.to).toISOString(),
        sourceIp: body.sourceIp,
        from,
        size
      });

      if (!response.ok) throw new Error('Erreur lors de la recherche')

      const data = await response.json()
      console.log('🔍 Search response:', { total: data.total, hitsCount: data.hits?.length });
      setTotalResults(data.total)
      
      // Supporter les deux formats de réponse
      let hitsArray = Array.isArray(data.hits) ? data.hits : [];
      console.log('📦 Hits array length:', hitsArray.length);
      let results_data = [];
      
      if (hitsArray.length > 0 && hitsArray[0]._source) {
        // Format Elasticsearch avec _source
        console.log('✅ Using _source format');
        try {
          results_data = hitsArray.map((hit, idx) => {
            try {
              return normalizeEsDocument(hit._source);
            } catch (e) {
              console.error(`Error normalizing hit ${idx}:`, e);
              return {};
            }
          });
        } catch (e) {
          console.error('Error in map:', e);
        }
      } else {
        console.warn('⚠️ No hits or unknown format:', hitsArray.length ? hitsArray[0] : 'empty');
      }
      
      console.log('📋 Normalized results:', results_data.length, results_data.slice(0, 2));
      setResults(results_data)
      
      // Afficher les résultats pour debug
      if (results_data.length === 0) {
        console.warn('⚠️ NO RESULTS TO DISPLAY!');
      }

      // Récupérer les stats agrégées pour TOUS les résultats (pas seulement les 50 paginés)
      if (searchMode === 'advanced') {
        try {
          const statsResponse = await fetch(`${BACKEND_URL}/api/exploration/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              timeRange: { from: startDate, to: endDate },
              sourceIp: filters.sourceIp.trim() || undefined
            })
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('📈 Aggregated stats for all results:', statsData);
            setStats(statsData);
          }
        } catch (statsErr) {
          console.warn('Could not fetch aggregated stats:', statsErr.message);
          // Fallback to page-based stats
          if (results_data.length > 0) {
            const totalBytes = results_data.reduce((sum, hit) => sum + (hit['network.bytes'] || 0), 0);
            const services = new Set(results_data.map(hit => hit['network.application'] || 'Unknown'));
            setStats({
              totalBytes,
              avgBytes: Math.round(totalBytes / results_data.length),
              uniqueServices: services.size,
              packetCount: results_data.length
            });
          }
        }
      } else if (searchMode === 'iprange') {
        // Recherche par plage d'IP - utiliser aussi l'endpoint stats
        try {
          const statsResponse = await fetch(`${BACKEND_URL}/api/exploration/ip-range-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              timeRange: { from: startDate, to: endDate },
              startIp: ipRangeStart,
              endIp: ipRangeEnd
            })
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('📈 IP Range aggregated stats:', statsData);
            setStats(statsData);
          }
        } catch (statsErr) {
          console.warn('Could not fetch IP range stats:', statsErr.message);
        }
      } else if (results_data.length > 0) {
        // Pour les autres modes, calculer sur les résultats reçus
        const totalBytes = results_data.reduce((sum, hit) => sum + (hit['network.bytes'] || 0), 0);
        const services = new Set(results_data.map(hit => hit['network.application'] || 'Unknown'));
        setStats({
          totalBytes,
          avgBytes: Math.round(totalBytes / results_data.length),
          uniqueServices: services.size,
          packetCount: results_data.length
        });
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
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '00:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '23:59'
    })
    setIpRangeStart('')
    setIpRangeEnd('')
    setSearchMode('advanced')
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

  // Générer les données pour les graphiques
  const getChartData = () => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return {
        protocolData: [],
        serviceData: []
      }
    }

    const protocolCounts = {}
    const serviceCounts = {}
    const topServices = {}

    results.forEach(row => {
      if (!row || typeof row !== 'object') return
      
      const protocol = row['network.protocol']?.toUpperCase() || 'UNKNOWN'
      const service = row['network.application'] || 'Unknown'
      const bytes = row['network.bytes'] || 0

      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1
      serviceCounts[service] = (serviceCounts[service] || 0) + 1
      topServices[service] = (topServices[service] || 0) + bytes
    })

    return {
      protocolData: Object.entries(protocolCounts).map(([name, value]) => ({ name, value })),
      serviceData: Object.entries(topServices)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, bytes: Math.round(value / 1024 / 1024) }))
    }
  }

  const chartData = getChartData()

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
      {/* En-tête */}
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
          <ExploreIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Exploration
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              Recherche personnalisée et avancée dans les données réseau Elasticsearch
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Mode de recherche */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <Button
          variant={searchMode === 'advanced' ? 'contained' : 'outlined'}
          onClick={() => {
            setSearchMode('advanced')
            setIpRangeStart('')
            setIpRangeEnd('')
          }}
          sx={{ fontWeight: searchMode === 'advanced' ? 'bold' : 'normal' }}
        >
          Recherche Avancée
        </Button>
        <Button
          variant={searchMode === 'iprange' ? 'contained' : 'outlined'}
          onClick={() => setSearchMode('iprange')}
          sx={{ fontWeight: searchMode === 'iprange' ? 'bold' : 'normal' }}
        >
          Plage d'IPs
        </Button>
      </Box>

      {searchMode === 'advanced' && (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Filtres de recherche - Recherche Avancée
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
          <Grid sx={{ xs: 12, sm: 6, md: 4}}>
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

          {/* Plage de dates */}
          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
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

          <Grid sx={{ xs: 12, sm: 6, md: 2}}>
            <TextField
              fullWidth
              size="small"
              label="Heure de début"
              type="time"
              value={filters.startTime}
              onChange={(e) => handleFilterChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>

          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
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

          <Grid sx={{ xs: 12, sm: 6, md: 2}}>
            <TextField
              fullWidth
              size="small"
              label="Heure de fin"
              type="time"
              value={filters.endTime}
              onChange={(e) => handleFilterChange('endTime', e.target.value)}
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
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                boxShadow: '0 8px 24px rgba(2, 100, 126, 0.4)'
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </Box>
      </Paper>
      )}

      {searchMode === 'iprange' && (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Recherche par Plage d'IPs
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid sx={{ xs: 12, sm: 6}}>
            <TextField
              fullWidth
              size="small"
              label="IP Client (début)"
              placeholder="ex: 192.168.1.1"
              value={ipRangeStart}
              onChange={(e) => setIpRangeStart(e.target.value)}
              variant="outlined"
              helperText="Première IP source (machine client)"
            />
          </Grid>

          <Grid sx={{ xs: 12, sm: 6}}>
            <TextField
              fullWidth
              size="small"
              label="IP Client (fin)"
              placeholder="ex: 192.168.255.255"
              value={ipRangeEnd}
              onChange={(e) => setIpRangeEnd(e.target.value)}
              variant="outlined"
              helperText="Dernière IP source (machine client)"
            />
          </Grid>

          <Grid sx={{ xs: 12, sm: 6}}>
            <TextField
              fullWidth
              size="small"
              label="Date de début"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid sx={{ xs: 12, sm: 6}}>
            <TextField
              fullWidth
              size="small"
              label="Date de fin"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !ipRangeStart || !ipRangeEnd}
            sx={{
              background: 'linear-gradient(135deg, #02647E 0%, #72BDD1 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                boxShadow: '0 8px 24px rgba(2, 100, 126, 0.4)'
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            {loading ? 'Recherche...' : 'Rechercher par plage'}
          </Button>
        </Box>
      </Paper>
      )}

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiques */}
      {results.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography color="textSecondary" gutterBottom>
                Total de paquets
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {stats.packetCount}
                </Typography>
            </Paper>
          </Grid>

          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography color="textSecondary" gutterBottom>
                Total de données
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatBytes(stats.totalBytes)}
              </Typography>
            </Paper>
          </Grid>

          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography color="textSecondary" gutterBottom>
                Moy. par paquet
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatBytes(stats.avgBytes)}
              </Typography>
            </Paper>
          </Grid>

          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography color="textSecondary" gutterBottom>
                Services uniques
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {stats.uniqueServices}
              </Typography>
            </Paper>
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
        <>
        <Paper elevation={2} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📊 Résultats ({totalResults} trouvés)
          </Typography>
          
          <Grid container spacing={2}>
            {results.map((row, index) => (
              <Grid key={index} sx={{ xs: 12, sm: 6, md: 4, lg: 3}}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${row['network.protocol'] === 'tcp' ? '#2196F3' : '#FF9800'}08 0%, transparent 100%)`,
                    border: `1px solid ${row['network.protocol'] === 'tcp' ? '#2196F3' : '#FF9800'}20`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 16px ${row['network.protocol'] === 'tcp' ? '#2196F3' : '#FF9800'}30`,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  {/* En-tête avec timestamp */}
                  <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                      {formatDate(row['@timestamp'])}
                    </Typography>
                  </Box>

                  {/* IPs */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      🔹 Flot
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip
                        label={row['source.ip'] || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      />
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>→</Typography>
                      <Chip
                        label={row['destination.ip'] || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>

                  {/* Ports */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      🔌 Ports
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      <Chip
                        label={`Source: ${row['source.port'] || 'N/A'}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      <Chip
                        label={`Dest: ${row['destination.port'] || 'N/A'}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>

                  {/* Service et Protocole */}
                  <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={row['network.application'] || 'Unknown'}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={row['network.protocol']?.toUpperCase() || 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: row['network.protocol'] === 'tcp' ? '#2196F3' : '#FF9800',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {/* Données */}
                  <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      📦 Données
                    </Typography>
                    <Chip
                      label={formatBytes(row['network.bytes'] || 0)}
                      size="small"
                      color={row['network.bytes'] > 1000000 ? 'error' : 'success'}
                      variant="filled"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Statistiques détaillées et graphiques */}
        {chartData.protocolData.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Protocoles */}
            <Grid sx={{ xs: 12, md: 6}}>
              <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  📊 Distribution des Protocoles
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {chartData.protocolData.map((proto, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: ['#2196F3', '#FF9800', '#4CAF50', '#F44336', '#9C27B0', '#00BCD4'][idx % 6]
                        }}
                      />
                      <Typography variant="caption">
                        {proto.name}: {proto.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Top Services */}
            {chartData.serviceData.length > 0 && (
              <Grid sx={{ xs: 12, md: 6}}>
                <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    📈 Top Services par Volume
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {chartData.serviceData.map((service, idx) => (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {service.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {service.bytes} MB
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${(service.bytes / (chartData.serviceData[0]?.bytes || 1)) * 100}%`,
                              backgroundColor: '#02647E',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Pagination */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            disabled={pagination.from === 0}
            onClick={() => {
              const newFrom = Math.max(0, pagination.from - pagination.size);
              setPagination(prev => ({ ...prev, from: newFrom }));
              performSearch(newFrom, pagination.size);
            }}
          >
            ← Précédent
          </Button>
          
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mx: 2 }}>
            Page {Math.floor(pagination.from / pagination.size) + 1} 
            <Typography component="span" sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
              {' '}({pagination.from + 1}-{Math.min(pagination.from + pagination.size, totalResults)} / {totalResults})
            </Typography>
          </Typography>
          
          <Button
            size="small"
            variant="contained"
            disabled={pagination.from + pagination.size >= totalResults}
            onClick={() => {
              const newFrom = pagination.from + pagination.size;
              setPagination(prev => ({ ...prev, from: newFrom }));
              performSearch(newFrom, pagination.size);
            }}
          >
            Suivant →
          </Button>
        </Box>
        </>
      )}

      {!loading && results.length === 0 && totalResults === 0 && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <FilterIconMUI sx={{ fontSize: 48, opacity: 0.5, display: 'block', margin: '0 auto 16px' }} />
          <Typography color="textSecondary">
            Aucun résultat. Modifiez vos filtres et relancez la recherche.
          </Typography>
        </Paper>
      )}
      </Box>
    </Box>
  )
}
