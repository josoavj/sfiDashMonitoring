import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SignUpComponent } from './components/SignUpComponent'
import { LogInComponent } from './components/LogInComponent'
import { DataVisualization } from './components/DataVisualization'
import theme from './theme'

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/visualization" replace />} />
                    <Route path="/auth/signup" element={<SignUpComponent />} />
                    <Route path="/auth/login" element={<LogInComponent />} />
                    <Route path="/visualization" element={<DataVisualization />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App
