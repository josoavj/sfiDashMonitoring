/**
 * CSRF Token Management - À intégrer dans le frontend
 * 
 * Ce fichier montre comment intégrer la protection CSRF dans le frontend
 * après la phase 2.
 */

/**
 * Service pour gérer les tokens CSRF
 */
class CSRFTokenService {
  constructor() {
    this.token = null;
    this.refreshInterval = 1000 * 60 * 60; // 1 heure
  }

  /**
   * Récupère un token CSRF du serveur
   */
  async fetchToken(apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include' // Envoyer les cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.csrfToken;
      
      console.log('[CSRF] ✅ Token récupéré avec succès');
      return this.token;
    } catch (error) {
      console.error('[CSRF] ❌ Erreur lors de la récupération du token:', error);
      throw error;
    }
  }

  /**
   * Obtient le token CSRF (le récupère s'il manque)
   */
  async getToken(apiUrl) {
    if (!this.token) {
      await this.fetchToken(apiUrl);
    }
    return this.token;
  }

  /**
   * Configure le planification du refresh du token
   */
  setupAutoRefresh(apiUrl) {
    setInterval(() => {
      this.fetchToken(apiUrl);
    }, this.refreshInterval);
  }
}

export const csrfService = new CSRFTokenService();

/**
 * Wrapper pour fetch() qui ajoute automatiquement le header CSRF
 * 
 * Usage:
 *   import { secureFetch } from './csrf';
 *   const response = await secureFetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify({ ... })
 *   });
 */
export async function secureFetch(url, options = {}) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Récupérer le token CSRF
  const csrfToken = await csrfService.getToken(apiUrl);

  // Préparer les options
  const fetchOptions = {
    ...options,
    credentials: 'include', // Envoyer les cookies
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken
    }
  };

  return fetch(url, fetchOptions);
}

/**
 * Intégration dans AuthContext (exemple)
 * 
 * Dans AuthContext.jsx, remplacer les fetch par secureFetch:
 * 
 * ```jsx
 * import { secureFetch, csrfService } from './csrf';
 * 
 * export function AuthProvider({ children }) {
 *   useEffect(() => {
 *     // Initialiser CSRF au démarrage
 *     csrfService.fetchToken(API_BASE);
 *     csrfService.setupAutoRefresh(API_BASE);
 *   }, []);
 * 
 *   async function login(email, password) {
 *     const res = await secureFetch(`${API_BASE}/auth/signin`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ email, password })
 *     });
 *     // ... reste du code
 *   }
 * }
 * ```
 */

/**
 * Hook React pour utiliser CSRF facilement
 * 
 * Usage dans un composant:
 * ```jsx
 * function MyComponent() {
 *   const { secureFetch } = useCSRF();
 *   
 *   async function handleSubmit() {
 *     const res = await secureFetch('/api/my-endpoint', {
 *       method: 'POST',
 *       body: JSON.stringify({ ... })
 *     });
 *   }
 * }
 * ```
 */
export function useCSRF() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  return {
    secureFetch: (url, options) => secureFetch(`${apiUrl}${url}`, options),
    getCSRFToken: () => csrfService.getToken(apiUrl)
  };
}
