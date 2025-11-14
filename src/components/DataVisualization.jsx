import { useState } from 'react'
import { Box, Stack, Breadcrumbs, Link, Typography, Grid } from '@mui/material'
import { NavigateNext, AccessTime, Loop } from '@mui/icons-material'
import { DataMainView } from './dashboard-elements/DataMainView'
import { MaxBytes } from './dashboard-elements/MaxBytes'
import { useNav } from '../context/NavContext'
const makeIcon = (IconComp) => <IconComp fontSize="15" sx={{ mx: 2 }} />

export function DataVisualization() {
    const { subItemActive } = useNav()

    const breadcrumbs = [
        <Link color="text.dark" underline="none" fontSize={15} key="home">
            Accueil
        </Link>,
        <Link color="text.dark" underline="none" fontSize={15} key="dash">
            Tableau de bord
        </Link>,
    ]

    if (subItemActive) {
        breadcrumbs.push(
            <Typography color="primary.lighter" fontSize={15} key="sub">
                {subItemActive.title}
            </Typography>
        )
    }

    return (
        <Grid
            container
            spacing={2}
            sx={{
                px: 7,
                pt: 10.5,
                height: '100vh',
                bgcolor: 'secondary.lighter',
            }}>
            <Grid size={subItemActive?.page === 'flow' ? 10 : 12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Breadcrumbs separator={<NavigateNext fontSize="small" />}>{breadcrumbs}</Breadcrumbs>

                    <Typography color="text.dark" fontSize={15} sx={{ display: 'flex', alignItems: 'center' }}>
                        {makeIcon(AccessTime)} | {makeIcon(Loop)}
                    </Typography>
                </Box>

                <Box component="main" sx={{ mt: 2 }}>
                    <DataMainView page={subItemActive?.page} />
                </Box>
            </Grid>

            {subItemActive?.page === 'flow' && (
                <Grid size={2} sx={{ my: 1 }}>
                    <Stack spacing={2} sx={{ height: '100%' }}>
                        <MaxBytes />
                    </Stack>
                </Grid>
            )}
        </Grid>
    )
}