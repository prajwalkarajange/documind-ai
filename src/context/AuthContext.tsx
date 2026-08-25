import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "@/services/authService";
import { setUnauthorizedHandler, tokenStorage, userStorage } from "@/services/api";
import type { LoginRequest, RegisterRequest, User } from "@/types/auth";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  backendStatus: 'checking' | 'awake' | 'waking_up' | 'slow' | 'unavailable';
  retryConnection: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'awake' | 'waking_up' | 'slow' | 'unavailable'>('checking');

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUserState(null);
  }, []);

  const checkBackend = useCallback(async (): Promise<boolean> => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const cleanUrl = baseUrl.replace(/\/$/, "");
      // Perform a raw fetch to /health with a small timeout to detect offline backend
      const res = await fetch(`${cleanUrl}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // Ignored: network failure
    }
    return false;
  }, []);

  // initial wakeup checks and polling loop
  useEffect(() => {
    let active = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let slowTimeoutId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      setBackendStatus('waking_up');
      
      // Transition to 'slow' if no response in 25 seconds
      slowTimeoutId = setTimeout(() => {
        if (active) setBackendStatus('slow');
      }, 25000);

      // Transition to 'unavailable' if no response in 60 seconds
      timeoutId = setTimeout(() => {
        if (active) {
          setBackendStatus('unavailable');
          if (pollInterval) clearInterval(pollInterval);
        }
      }, 60000);

      pollInterval = setInterval(async () => {
        const isUp = await checkBackend();
        if (isUp && active) {
          setBackendStatus('awake');
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          if (slowTimeoutId) clearTimeout(slowTimeoutId);
        }
      }, 3000);
    };

    const init = async () => {
      const isUp = await checkBackend();
      if (isUp) {
        setBackendStatus('awake');
      } else {
        startPolling();
      }
    };

    init();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (slowTimeoutId) clearTimeout(slowTimeoutId);
    };
  }, [checkBackend]);

  const retryConnection = useCallback(() => {
    setBackendStatus('checking');
    const trigger = async () => {
      const isUp = await checkBackend();
      if (isUp) {
        setBackendStatus('awake');
      } else {
        setBackendStatus('waking_up');
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const up = await checkBackend();
          if (up) {
            setBackendStatus('awake');
            clearInterval(interval);
          } else if (attempts >= 10) { // Poll for 30 more seconds on manual retry
            setBackendStatus('unavailable');
            clearInterval(interval);
          }
        }, 3000);
      }
    };
    trigger();
  }, [checkBackend]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=1";
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Load user details only once the backend is confirmed awake
  useEffect(() => {
    if (backendStatus !== 'awake') return;

    const stored = tokenStorage.get();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    setToken(stored);
    const cached = userStorage.get<User>();
    if (cached) setUserState(cached);

    let active = true;
    authService
      .me()
      .then((fresh) => {
        if (!active) return;
        setUserState(fresh);
        userStorage.set(fresh);
      })
      .catch(() => {
        // Handled globally
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backendStatus]);

  const login = useCallback(async (payload: LoginRequest) => {
    const result = await authService.login(payload);
    tokenStorage.set(result.token);
    userStorage.set(result.user);
    setToken(result.token);
    setUserState(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    await authService.register(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    }
    clearSession();
  }, [clearSession]);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    userStorage.set(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
      setUser,
      backendStatus,
      retryConnection,
    }),
    [user, token, isLoading, login, register, logout, setUser, backendStatus, retryConnection],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}