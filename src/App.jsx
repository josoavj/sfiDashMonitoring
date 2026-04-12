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
import { ProtectedRoute, PublicRoute } from './context/ProtectedRoutes'
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
                                <Route path="/auth/signup" element={<PublicRoute><SignUpComponent /></PublicRoute>} />
                                <Route path="/auth/login" element={<PublicRoute><LogInComponent /></PublicRoute>} />
                                <Route path="/visualization" element={<ProtectedRoute><DataVisualization /></ProtectedRoute>} />
                                <Route path="/exploration" element={<ProtectedRoute><ExplorationPage /></ProtectedRoute>} />
                                <Route path="/ip-view" element={<ProtectedRoute><IPViewPage /></ProtectedRoute>} />
                                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                                <Route path="/alerts" element={<ProtectedRoute><AlertesPage /></ProtectedRoute>} />
                                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                            </Routes>
                        </Suspense>
                    </NavProvider>
                </NotificationProvider>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App
