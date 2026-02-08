import React, { createContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Temps de tampon (ms) pour faire un refresh avant l'expiration du token
const REFRESH_BUFFER = 60000 // 1 minute avant expiration

/**
 * Decode un JWT sans vérifier la signature (pour le client)
 * N'utilise QUE pour lire l'expiration - la vérification se fait côté serveur
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Calcule le temps avant expiration du token
 */
function getTokenExpiresIn(token) {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return 0
  return decoded.exp * 1000 - Date.now()
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [refreshTokenTimeout, setRefreshTokenTimeout] = useState(null)

    /**
     * Planifie un refresh automatique du token avant son expiration
     */
    const scheduleTokenRefresh = useCallback((token) => {
        // Annuler le refresh précédent
        if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout)

        const expiresIn = getTokenExpiresIn(token)
        if (expiresIn <= 0) return

        // Refresh X ms avant expiration
        const timeUntilRefresh = Math.max(expiresIn - REFRESH_BUFFER, 5000)
        console.log(`[Auth] Token refresh schedulé dans ${timeUntilRefresh}ms`)

        const timeout = setTimeout(() => {
            console.log('[Auth] Refresh automatique du token...')
            refreshAccessToken()
        }, timeUntilRefresh)

        setRefreshTokenTimeout(timeout)
    }, [refreshTokenTimeout])

    /**
     * Actualise l'access token en utilisant le refresh token (stocké en cookie)
     */
    async function refreshAccessToken() {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // Envoyer les cookies (refreshToken)
            })

            if (!res.ok) {
                // Token refresh failed - user needs to login again
                logout()
                throw new Error('Session expirée, veuillez vous reconnecter')
            }

            const data = await res.json()
            // Mettre à jour le token en mémoire
            localStorage.setItem('accessToken', data.accessToken)
            setUser(prev => ({
                ...prev,
                accessToken: data.accessToken
            }))

            // Re-planifier le prochain refresh
            scheduleTokenRefresh(data.accessToken)

            return data.accessToken
        } catch (err) {
            console.error('[Auth] Refresh token error:', err)
            logout()
            throw err
        }
    }

    /**
     * Vérifie si le token a besoin d'être rafraîchi
     */
    async function ensureValidToken() {
        const token = localStorage.getItem('accessToken')
        if (!token) return null

        const expiresIn = getTokenExpiresIn(token)
        if (expiresIn <= REFRESH_BUFFER) {
            // Token expire bientôt, faire un refresh maintenant
            try {
                return await refreshAccessToken()
            } catch {
                return null
            }
        }

        return token
    }

    // Vérifier le token au chargement
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            // Vérifier que le token est valide
            ensureValidToken().then(validToken => {
                if (validToken) {
                    const user = localStorage.getItem('user')
                    if (user) {
                        setUser({ accessToken: validToken, ...JSON.parse(user) })
                        // Planifier le prochain refresh
                        scheduleTokenRefresh(validToken)
                    }
                }
            })
        }
    }, [])

    // Cleanup du timeout au unmount
    useEffect(() => {
        return () => {
            if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout)
        }
    }, [refreshTokenTimeout])

    async function login(email, password) {
        const res = await fetch(`${API_BASE}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Recevoir le cookie refreshToken
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Erreur connexion')
        }
        const data = await res.json()
        // PLUS de localStorage pour refreshToken - il est en cookie HttpOnly
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser({ accessToken: data.accessToken, ...data.user })
        // Planifier le prochain refresh
        scheduleTokenRefresh(data.accessToken)
        return data
    }

    async function signup(firstName, lastName, email, password) {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password }),
            credentials: 'include' // Recevoir le cookie refreshToken
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Erreur inscription')
        }
        const data = await res.json()
        // NOTE: signup does NOT auto-login the user. The flow is: signup -> go to login page -> login
        return data
    }

    async function logout() {
        try {
            // Signaler au serveur de révoquer les sessions
            await fetch(`${API_BASE}/auth/signout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                credentials: 'include'
            }).catch(() => {}) // Ignorer les erreurs (token peut être expiré)
        } finally {
            // Nettoyer le localStorage
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            setUser(null)
            // Le cookie refreshToken sera supprimé par le serveur
            if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout)
        }
    }

    /**
     * Retourne l'header Authorization avec le token valide
     * Utilise le token en mémoire ou en localStorage
     */
    function authHeader() {
        const token = user?.accessToken || localStorage.getItem('accessToken')
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, authHeader, ensureValidToken, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
