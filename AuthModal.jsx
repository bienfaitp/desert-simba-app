import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Lock, User, LogIn, X } from "lucide-react";

export default function AuthModal({ mode: initialMode, onClose }) {
  const [mode, setMode] = useState(initialMode || "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name } } });
        if (error) throw error;
        setMsg({ ok: true, text: "Account created. Check your email to confirm, then sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        // On success the auth listener swaps the whole app to the portal; nothing else to do.
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <div className="eyebrow" style={{ color: "var(--sunset)", marginBottom: 6 }}>Desert Simba Academy</div>
        <h2 style={{ fontSize: 24, marginBottom: 4 }}>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
          {mode === "signup" ? "Register as a parent to enroll your child." : "Sign in to your club portal."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <div className="field"><label>Full name</label>
              <div style={{ position: "relative" }}><User size={16} style={ICO} />
                <input className="input" style={{ paddingLeft: 40 }} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" /></div>
            </div>
          )}
          <div className="field"><label>Email</label>
            <div style={{ position: "relative" }}><Mail size={16} style={ICO} />
              <input className="input" style={{ paddingLeft: 40 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" /></div>
          </div>
          <div className="field"><label>Password</label>
            <div style={{ position: "relative" }}><Lock size={16} style={ICO} />
              <input className="input" style={{ paddingLeft: 40 }} type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} placeholder="••••••••" /></div>
          </div>
          {msg && <div className="notice" style={{ borderLeftColor: msg.ok ? "var(--oasis)" : "var(--clay)", fontSize: 13 }}>{msg.text}</div>}
          <button className="btn primary block" disabled={busy}><LogIn size={16} /> {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="muted" style={{ textAlign: "center", fontSize: 14, marginTop: 16 }}>
          {mode === "signup" ? "Already have an account? " : "New to the club? "}
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null); }}
            style={{ color: "var(--sunset)", fontWeight: 700 }}>{mode === "signup" ? "Sign in" : "Create one"}</button>
        </p>
      </div>
    </div>
  );
}

const ICO = { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" };
