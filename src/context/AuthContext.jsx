import React, { createContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) setUser({ accessToken: token })
    }, [])

    async function login(email, password) {
        const res = await fetch(`${API_BASE}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || 'Erreur connexion')
        }
        const data = await res.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setUser({ accessToken: data.accessToken })
        return data
    }

    async function signup(firstName, lastName, email, password) {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password })
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || 'Erreur inscription')
        }
        const data = await res.json()
        // NOTE: signup does NOT auto-login the user. The flow is: signup -> go to login page -> login
        // Return server data so caller can show a notification and redirect.
        return data
    }

    function logout() {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
    }

    function authHeader() {
        const token = localStorage.getItem('accessToken')
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, authHeader }}>{children}</AuthContext.Provider>
    )
}

export default AuthContext
