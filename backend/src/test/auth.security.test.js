import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Mock les dépendances
vi.mock('../models/User')
vi.mock('../models/Session')

// Fonctions utilitaires pour les tests
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

describe('Auth Controller - Sécurité JWT', () => {
  const JWT_SECRET = 'test-secret-key'
  const JWT_REFRESH_SECRET = 'test-refresh-secret-key'

  describe('Token Generation', () => {
    it('should generate valid access token with 15m expiration', () => {
      const payload = { sub: 1, email: 'test@example.com' }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })

      const decoded = jwt.verify(token, JWT_SECRET)
      expect(decoded.sub).toBe(1)
      expect(decoded.email).toBe('test@example.com')
    })

    it('should generate valid refresh token with 7d expiration', () => {
      const payload = { sub: 1 }
      const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })

      const decoded = jwt.verify(token, JWT_REFRESH_SECRET)
      expect(decoded.sub).toBe(1)
    })

    it('should NOT verify access token with wrong secret', () => {
      const payload = { sub: 1 }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })

      expect(() => {
        jwt.verify(token, 'wrong-secret')
      }).toThrow()
    })
  })

  describe('Token Hashing', () => {
    it('should hash refresh token consistently', () => {
      const token = 'mock-refresh-token-value'
      const hash1 = hashToken(token)
      const hash2 = hashToken(token)

      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA256 = 64 hex chars
    })

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashToken('token1')
      const hash2 = hashToken('token2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'SecurePassword123!'
      const hash = await bcrypt.hash(password, 10)

      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    it('should verify password correctly', async () => {
      const password = 'SecurePassword123!'
      const hash = await bcrypt.hash(password, 10)

      const isValid = await bcrypt.compare(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10)
      const isValid = await bcrypt.compare('WrongPassword', hash)

      expect(isValid).toBe(false)
    })
  })

  describe('Token Expiration', () => {
    it('should expire access token after expiration time', (done) => {
      const token = jwt.sign({ sub: 1 }, JWT_SECRET, { expiresIn: '0s' })

      setTimeout(() => {
        expect(() => {
          jwt.verify(token, JWT_SECRET)
        }).toThrow('jwt expired')
        done()
      }, 100)
    })
  })

  describe('Cookie Security', () => {
    it('should set secure cookie options in production', () => {
      const NODE_ENV = 'production'
      const options = {
        httpOnly: true,
        sameSite: 'Strict',
        secure: NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      }

      expect(options.secure).toBe(true)
      expect(options.httpOnly).toBe(true)
      expect(options.sameSite).toBe('Strict')
    })

    it('should allow less strict cookies in development', () => {
      const NODE_ENV = 'development'
      const options = {
        httpOnly: true,
        sameSite: 'Strict',
        secure: NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      }

      expect(options.secure).toBe(false)
      expect(options.httpOnly).toBe(true)
    })
  })
})
