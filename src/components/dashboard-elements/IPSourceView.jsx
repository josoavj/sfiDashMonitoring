import { Box, Typography } from '@mui/material'
import IPViewPage from '../IPViewPage'

/**
 * Wrapper pour afficher IPViewPage dans le contexte du tableau de bord
 */
export function IPSourceView() {
    return (
        <Box>
            <IPViewPage />
        </Box>
    )
}

export default IPSourceView
