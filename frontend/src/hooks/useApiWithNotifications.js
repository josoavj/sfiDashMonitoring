import { useNotifications } from '../context/NotificationContext'

/**
 * Hook pour faciliter les requêtes API avec notifications automatiques
 */
export function useApiWithNotifications() {
  const { addNotification } = useNotifications()

  const fetchWithNotification = async (url, options = {}, notificationConfig = {}) => {
    const {
      successMessage = null,
      errorMessage = null,
      showSuccess = true,
      showError = true,
      successDuration = 5000,
      errorDuration = 0 // Les erreurs persistent par défaut
    } = notificationConfig

    try {
      const token = localStorage.getItem('accessToken')
      const headers = options.headers || {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(url, { ...options, headers })
      
      if (!res.ok) {
        const error = new Error(`${res.status} ${res.statusText}`)
        error.status = res.status
        throw error
      }

      if (showSuccess && successMessage) {
        addNotification(successMessage, 'success', successDuration)
      }

      return res
    } catch (err) {
      const message = errorMessage || `Erreur: ${err.message}`
      if (showError) {
        addNotification(message, 'error', errorDuration)
      }
      throw err
    }
  }

  return { fetchWithNotification, addNotification }
}
