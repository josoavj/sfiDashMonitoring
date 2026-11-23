import { Box, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

export default function ChartLoadingSkeleton({
    height = 280,
    withLegend = true,
    withHeader = false,
    chartType = 'line',
}) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const points = isMobile ? 5 : 7

    const areaHeights = isMobile ? ['30%', '54%', '36%', '66%', '42%'] : ['26%', '44%', '32%', '62%', '38%', '56%', '48%']
    const barHeights = isMobile ? ['48%', '62%', '34%', '70%', '52%'] : ['42%', '56%', '30%', '68%', '50%', '74%', '58%']
    const lineHeights = isMobile ? ['36%', '58%', '42%', '64%', '46%'] : ['34%', '50%', '38%', '64%', '44%', '60%', '48%']

    const currentHeights = chartType === 'bar' ? barHeights : chartType === 'area' ? areaHeights : lineHeights

    const titleWidth = isMobile ? '62%' : '38%'
    const badgeWidth = isMobile ? 72 : 96

    return (
        <Stack spacing={1.5} sx={{ width: '100%' }}>
            {withHeader ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                    <Skeleton variant="text" width={titleWidth} height={30} />
                    <Skeleton variant="rounded" width={badgeWidth} height={30} />
                </Stack>
            ) : null}

            {withLegend ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Skeleton variant="rounded" width={isMobile ? 84 : 96} height={22} />
                    <Skeleton variant="rounded" width={isMobile ? 78 : 88} height={22} />
                    <Skeleton variant="rounded" width={isMobile ? 90 : 102} height={22} />
                </Stack>
            ) : null}

            <Box
                sx={{
                    width: '100%',
                    height,
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(2, 100, 126, 0.14)',
                    background: 'linear-gradient(180deg, rgba(2,100,126,0.06) 0%, rgba(2,100,126,0.02) 100%)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        transform: 'translateX(-100%)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 45%, rgba(255,255,255,0) 100%)',
                        animation: 'chartShimmer 1.45s ease-in-out infinite',
                        zIndex: 2,
                    },
                    '@keyframes chartShimmer': {
                        '100%': { transform: 'translateX(100%)' },
                    },
                }}
            >
                <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
                <Box sx={{ position: 'absolute', inset: 0, p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'flex-end', gap: isMobile ? 0.7 : 1, zIndex: 1 }}>
                    {Array.from({ length: points }).map((_, idx) => (
                        <Skeleton
                            key={idx}
                            variant={chartType === 'line' ? 'rounded' : 'rounded'}
                            width={`${100 / points - (isMobile ? 2.3 : 1.8)}%`}
                            height={currentHeights[idx] || currentHeights[currentHeights.length - 1]}
                            sx={{
                                borderRadius: chartType === 'bar' ? 1 : 2,
                                opacity: chartType === 'area' ? 0.8 : 1,
                            }}
                        />
                    ))}
                </Box>
            </Box>
        </Stack>
    )
}
