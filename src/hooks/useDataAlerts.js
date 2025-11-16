/**
 * Système d'alertes pour les données anormales
 * Détecte et notifie les anomalies réseau
 */
import { useNotifications } from '../context/NotificationContext'

export function useDataAlerts() {
  const { addNotification } = useNotifications()

  const checkBandwidthAnomaly = (currentBandwidth, averageBandwidth, threshold = 2.0) => {
    if (currentBandwidth > averageBandwidth * threshold) {
      const message = `⚠️ Pic de bande passante détecté: ${(currentBandwidth / 1024 / 1024).toFixed(2)} MB/s`
      addNotification(message, 'warning', 8000)
      return true
    }
    return false
  }

  const checkHighPacketLoss = (packetLoss, threshold = 5) => {
    if (packetLoss > threshold) {
      const message = `🚨 Perte de paquets détectée: ${packetLoss.toFixed(2)}%`
      addNotification(message, 'error', 0)
      return true
    }
    return false
  }

  const checkUnusualTraffic = (sourceIP, bytesCount, threshold = 1000000000) => {
    if (bytesCount > threshold) {
      const message = `📊 Trafic anormal de ${sourceIP}: ${(bytesCount / 1024 / 1024 / 1024).toFixed(2)} GB`
      addNotification(message, 'warning', 8000)
      return true
    }
    return false
  }

  const checkServiceDown = (serviceName) => {
    const message = `🔴 Service indisponible: ${serviceName}`
    addNotification(message, 'error', 0)
  }

  const checkDDoSLikeBehavior = (connections, threshold = 10000) => {
    if (connections > threshold) {
      const message = `🚨 Comportement suspect détecté: ${connections} connexions entrantes`
      addNotification(message, 'error', 0)
      return true
    }
    return false
  }

  const notifyConnectionRestored = (serviceName) => {
    const message = `✅ Connexion rétablie: ${serviceName}`
    addNotification(message, 'success', 5000)
  }

  return {
    checkBandwidthAnomaly,
    checkHighPacketLoss,
    checkUnusualTraffic,
    checkServiceDown,
    checkDDoSLikeBehavior,
    notifyConnectionRestored
  }
}
