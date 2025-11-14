import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // keep a hook for future logging (Sentry, etc.)
    // console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <h2 style={{ color: '#b00020' }}>Une erreur est survenue</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
            {err?.message || String(err)}
          </pre>
          <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
            <summary>Détails (developer)</summary>
            <pre>{err?.stack}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
