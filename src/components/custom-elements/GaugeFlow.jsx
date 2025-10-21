import { Stack, Grid, Typography } from '@mui/material'
import { Gauge } from '@mui/x-charts/Gauge'

export function GaugeFlow({ icon, title, description, gaugeValue, gaugeColor, dataUnite, layoutType = 'column' }) {
    return (
        <Stack
            spacing={3}
            direction={layoutType}
            sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 3,
                width: '100%',
                // height: '50%',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#D3D3D3',
                borderRadius: 1.5,
            }}>
            <Grid container spacing={2} size={layoutType === 'column' ? 12 : 6}>
                <Stack spacing={1} direction="row" alignItems="center" sx={{ width: '100%' }}>
                    {icon}
                    <Typography fontSize={17} sx={{ color: '#6D6D6D' }}>
                        {title}
                    </Typography>
                </Stack>

                <Typography textAlign="center" fontSize={15}>
                    {description}
                </Typography>
            </Grid>

            <Grid container>
                <Gauge
                    width={200}
                    height={130}
                    startAngle={-130}
                    endAngle={130}
                    value={gaugeValue}
                    innerRadius={50}
                    cornerRadius={50}
                    fontSize={22}
                    sx={{
                        ['& .MuiGauge-valueArc']: {
                            fill: gaugeColor,
                        },
                        ['& .MuiGauge-valueText']: {
                            fontWeight: 600,
                            whiteSpace: 'pre',
                            transform: 'translate(0px, 5px)',
                            '& tspan:first-of-type': {
                                fontSize: 30,
                            },
                            '& tspan:last-of-type': {
                                fontSize: 15,
                                fontWeight: 400,
                                fill: '#808080',
                            },
                        },
                    }}
                    text={({ value }) => {
                        return `${value}\n${dataUnite}`
                    }}
                />
            </Grid>
        </Stack>
    )
}
