import {
    Card,
    CardHeader,
    CardContent,
    Stack,
    Typography,
    Box,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material'
import { LineChart } from '@mui/x-charts'

export function LinechartService({ title, dataFrom }) {
    if (!dataFrom || !dataFrom.length) {
        return (
            <Card>
                <CardHeader
                    title={title}
                    slotProps={{ title: { fontSize: 16, color: 'text.dark' } }}
                    sx={{ bgcolor: '#F7F7F7' }}
                />
                <CardContent>
                    <Box sx={{ minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Aucune donnée disponible pour ce graphe.</Typography>
                    </Box>
                </CardContent>
            </Card>
        )
    }

    // Extraire les noms des services selon le tableau
    const serviceNames = Object.keys(dataFrom[0]).filter((key) => key !== 'time')

    // Les couleurs
    const colors = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6', '#DD4477']

    const series = serviceNames.map((service, index) => ({
        data: dataFrom.map((d) => d[service].value),
        label: service,
        color: colors[index % colors.length],
        showMark: false,
    }))

    return (
        <Card>
            <CardHeader
                title={title}
                slotProps={{ title: { fontSize: 16, color: 'text.dark' } }}
                sx={{ bgcolor: '#F7F7F7' }}
            />

            <CardContent>
                <LineChart
                    xAxis={[{ scaleType: 'point', data: dataFrom.map((d) => d.time), showMark: false }]}
                    series={series}
                    grid={{ vartical: true, horizontal: true }}
                    margin={{ left: -30, bottom: 0 }}
                    height={250}
                    hideLegend
                />

                {/* --- Légende dans un tableau --- */}
                <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell width={40}></TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Nom
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Max
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Total
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {series.map((s) => {
                            const last = dataFrom[dataFrom.length - 1][s.label]
                            return (
                                <TableRow key={s.label}>
                                    {/* Couleur */}
                                    <TableCell>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: s.color,
                                            }}
                                        />
                                    </TableCell>

                                    {/* Nom */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                                            {s.label}
                                        </Typography>
                                    </TableCell>

                                    {/* Max */}
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                                            {last.max}
                                        </Typography>
                                    </TableCell>

                                    {/* Total */}
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                                            {last.total}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
