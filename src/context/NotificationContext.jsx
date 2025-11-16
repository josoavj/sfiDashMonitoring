import React, { createContext, useContext, useCallback, useState } from 'react'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, severity = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, severity, timestamp: new Date() }
    
    setNotifications(prev => [notification, ...prev])
    
    // Auto-remove après duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
