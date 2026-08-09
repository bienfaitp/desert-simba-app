import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUser(uid) {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("*").eq("id", uid).single(),
    ]);
    setRoles((r || []).map((x) => x.role));
    setProfile(p || null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadUser(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await loadUser(s.user.id);
      else { setRoles([]); setProfile(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();
  const refresh = () => session && loadUser(session.user.id);

  return (
    <AuthCtx.Provider value={{ session, user: session?.user, profile, roles, loading, signOut, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
