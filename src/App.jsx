import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, CircularProgress, Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { Suspense, lazy } from 'react'

// Lazy load route components
const SignUpComponent = lazy(() => import('./components/SignUpComponent').then(m => ({ default: m.SignUpComponent })))
const LogInComponent = lazy(() => import('./components/LogInComponent').then(m => ({ default: m.LogInComponent })))
const DataVisualization = lazy(() => import('./components/DataVisualization'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const ReportsPage = lazy(() => import('./components/ReportsPage'))
const AlertesPage = lazy(() => import('./components/AlertesPage').then(m => ({ default: m.AlertesPage })))
const ExplorationPage = lazy(() => import('./components/ExplorationPage'))
const IPViewPage = lazy(() => import('./components/IPViewPage'))

import TopBar from './components/TopBar'
import { NotificationBanner } from './components/NotificationBanner'
import { NavProvider } from './context/NavContext'
import { NotificationProvider } from './context/NotificationContext'
import theme from './theme'

// Loading fallback component
const LoadingFallback = () => (
    <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
    }}>
        <CircularProgress />
    </Box>
)

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <NotificationProvider>
                    <NavProvider>
                        <TopBar />
                        <NotificationBanner />
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/visualization" replace />} />
                                <Route path="/auth/signup" element={<SignUpComponent />} />
                                <Route path="/auth/login" element={<LogInComponent />} />
                                <Route path="/visualization" element={<DataVisualization />} />
                                <Route path="/exploration" element={<ExplorationPage />} />
                                <Route path="/ip-view" element={<IPViewPage />} />
                                <Route path="/reports" element={<ReportsPage />} />
                                <Route path="/alerts" element={<AlertesPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                            </Routes>
                        </Suspense>
                    </NavProvider>
                </NotificationProvider>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App
