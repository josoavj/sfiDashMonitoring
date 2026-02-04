import { useCallback } from 'react'
import React from 'react'

/**
 * Cache simple en mémoire pour les appels API
 * Évite les appels dupliqués dans une fenêtre de temps
 */
class ApiCache {
    constructor(ttl = 60000) { // 60 secondes par défaut
        this.cache = new Map()
        this.ttl = ttl
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        })
    }

    get(key) {
        const item = this.cache.get(key)
        if (!item) return null

        // Vérifier si le cache est expiré
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key)
            return null
        }

        return item.value
    }

    clear() {
        this.cache.clear()
    }
}

const globalCache = new ApiCache()

/**
 * Hook pour cacher les résultats d'appels API
 * Retourne la valeur en cache ou undefined si pas en cache
 * @param {string} key - Clé unique pour le cache
 * @param {number} ttl - Durée de vie en ms (défaut: 60s)
 * @returns {object} { getCached, setCached, clearCache }
 */
export function useApiCache(ttl = 60000) {
    const getCached = useCallback((key) => {
        return globalCache.get(key)
    }, [])

    const setCached = useCallback((key, value) => {
        globalCache.set(key, value)
    }, [])

    const clearCache = useCallback(() => {
        globalCache.clear()
    }, [])

    return { getCached, setCached, clearCache }
}

/**
 * Version alternative: useApiFetch avec cache automatique
 * Usage: const { data, loading, error } = useApiFetch(url, options)
 */
export function useApiFetch(url, options = {}, ttl = 60000) {
    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)
    const { getCached, setCached } = useApiCache(ttl)

    React.useEffect(() => {
        const fetchData = async () => {
            // Vérifier le cache d'abord
            const cached = getCached(url)
            if (cached) {
                setData(cached)
                return
            }

            setLoading(true)
            try {
                const response = await fetch(url, options)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const result = await response.json()
                setCached(url, result)
                setData(result)
                setError(null)
            } catch (err) {
                setError(err.message)
                setData(null)
            } finally {
                setLoading(false)
            }
        }

        if (url) {
            fetchData()
        }
    }, [url, options, getCached, setCached])

    return { data, loading, error }
}
