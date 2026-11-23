import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebsocketContext'
import ErrorBoundary from './components/ErrorBoundary'
import './style.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WebSocketProvider>
          <App />
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
