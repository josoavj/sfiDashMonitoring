import { Stack, Typography } from '@mui/material'
import { SparkLineChart } from '@mui/x-charts'

export function SparklineSource({ icon, title }) {
    const sparklineData = [
        { x: 1, y: 23.45 },
        { x: 2, y: 67.89 },
        { x: 3, y: 45.12 },
        { x: 4, y: 78.34 },
        { x: 5, y: 12.09 },
        { x: 6, y: 98.76 },
        { x: 7, y: 54.33 },
        { x: 8, y: 66.21 },
        { x: 9, y: 43.99 },
        { x: 10, y: 87.45 },
        { x: 11, y: 21.34 },
        { x: 12, y: 65.78 },
        { x: 13, y: 34.56 },
        { x: 14, y: 89.23 },
        { x: 15, y: 10.11 },
        { x: 16, y: 77.89 },
        { x: 17, y: 59.22 },
        { x: 18, y: 23.67 },
        { x: 19, y: 92.44 },
        { x: 20, y: 41.09 },
    ]

    return (
        <Stack
            spacing={3}
            sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 3,
                width: '100%',
                // height: '50%',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#D3D3D3',
                borderRadius: 1.5,
            }}>
            <Stack spacing={1} direction="row" alignContent="center" sx={{ width: '100%' }}>
                {icon}
                <Typography fontSize={17} sx={{ color: '#6D6D6D' }}>
                    {title}
                </Typography>
            </Stack>

            <SparkLineChart data={sparklineData.map((d) => d.y)} height={50} curve="linear" sx={{ width: '75%' }} />
        </Stack>
    )
}
