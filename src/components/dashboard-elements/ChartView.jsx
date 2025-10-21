import { LineChart } from '@mui/x-charts'

export function ChartView() {
    const dataset = [
        { time: '06:55', logs: 580 },
        { time: '07:00', logs: 760 },
        { time: '07:05', logs: 360 },
        { time: '07:10', logs: 720 },
        { time: '07:15', logs: 800 },
        { time: '07:20', logs: 860 },
        { time: '07:25', logs: 720 },
        { time: '07:30', logs: 750 },
        { time: '07:35', logs: 420 },
        { time: '07:40', logs: 620 },
        { time: '07:45', logs: 980 },
        { time: '07:50', logs: 860 },
    ]

    return (
        <LineChart
            xAxis={[{ scaleType: 'point', data: dataset.map((d) => d.time), showMark: false }]}
            series={[
                {
                    data: dataset.map((d) => d.logs),
                    showMark: false,
                    area: true,
                    label: 'Count',
                    color: '#29BAE2',
                },
            ]}
            grid={{ vertical: true, horizontal: true }}
            margin={{ left: 0, bottom: 0 }}
            height={520}
            sx={{
                '& .MuiAreaElement-root': { fill: 'url(#Gradient)' },
                '& .MuiLineElement-root': { strokeWidth: 4 },
            }}
            slotProps={{
                legend: {
                    direction: 'horizontal',
                    position: { vertical: 'top', horizontal: 'start' },
                    sx: {
                        marginLeft: 6,
                        fontSize: 15,
                        '& .MuiChartsLegend-series': {
                            width: 100,
                        },
                    },
                },
            }}>
            <linearGradient id="Gradient" x1="0%" y1="120%" x2="0%" y2="0%">
                <stop offset="0" stopColor="#FFFFFF77" />
                <stop offset="1" stopColor="#29BAE277" />
            </linearGradient>
        </LineChart>
    )
}
