import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { SignUpComponent } from './components/SignUpComponent'
import { LogInComponent } from './components/LogInComponent'
import { DataVisualization } from './components/DataVisualization'
import SettingsPage from './components/SettingsPage'
import ProfilePage from './components/ProfilePage'
import ReportsPage from './components/ReportsPage'
import { AlertesPage } from './components/AlertesPage'
import ExplorationPage from './components/ExplorationPage'
import IPViewPage from './components/IPViewPage'
import TopBar from './components/TopBar'
import { NotificationBanner } from './components/NotificationBanner'
import { NavProvider } from './context/NavContext'
import { NotificationProvider } from './context/NotificationContext'
import theme from './theme'

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <NotificationProvider>
                    <NavProvider>
                        <TopBar />
                        <NotificationBanner />
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
                    </NavProvider>
                </NotificationProvider>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App
