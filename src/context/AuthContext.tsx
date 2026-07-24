"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** true once the __session cookie has been written — safe to navigate to server-protected pages */
  sessionReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  sessionReady: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Update UI immediately — never block on the cookie fetch.
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Write the __session cookie, then mark it ready so protected links unlock.
        setSessionReady(false);
        firebaseUser.getIdToken().then((idToken) =>
          fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          })
        ).then(() => {
          setSessionReady(true);
        }).catch(() => {
          // Cookie write failed — still mark ready so the user isn't permanently blocked.
          setSessionReady(true);
        });
      } else {
        setSessionReady(false);
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, loading, sessionReady }), [user, loading, sessionReady]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
