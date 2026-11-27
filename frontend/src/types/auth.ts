/**
 * Interfaces TypeScript pour l'Authentification & Utilisateurs
 */

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}
