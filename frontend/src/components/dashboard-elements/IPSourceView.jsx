import { Box, Typography } from '@mui/material'
import { memo } from 'react'
import IPViewPage from '../IPViewPage'

/**
 * Wrapper pour afficher IPViewPage dans le contexte du tableau de bord
 */
export const IPSourceView = memo(function IPSourceView() {
    return (
        <Box>
            <IPViewPage />
        </Box>
    )
})

export default IPSourceView
