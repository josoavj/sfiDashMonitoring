import { useState, useEffect } from 'react'

/**
 * Hook pour debouncer une valeur
 * Utile pour les champs de recherche/input qui déclenchent des appels API
 * @param {*} value - La valeur à debouncer
 * @param {number} delay - Délai en ms (défaut: 500ms)
 * @returns {*} La valeur debounced
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        // Créer un timer
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        // Nettoyer le timer précédent si la valeur change avant le délai
        return () => clearTimeout(handler)
    }, [value, delay])

    return debouncedValue
}
