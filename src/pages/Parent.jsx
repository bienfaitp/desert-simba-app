import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { Empty, initials } from "../lib/ui";
import { attendanceFor, goalsFor } from "../lib/stats";
import { UserPlus, Users, CheckCircle2, Clock } from "lucide-react";

export default function Parent({ view }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [regs, setRegs] = useState([]);
  const [att, setAtt] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first: "", last: "", dob: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: r }, { data: a }, { data: s }] = await Promise.all([
      supabase.from("players").select("*").eq("parent_id", user.id),
      supabase.from("registrations").select("*").eq("parent_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("attendance").select("*"),      // RLS: only this parent's children
      supabase.from("match_stats").select("*"),
    ]);
    setPlayers(p || []); setRegs(r || []); setAtt(a || []); setStats(s || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function register(e) {
    e.preventDefault();
    if (!form.first.trim() || !form.last.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("registrations").insert({
      parent_id: user.id, child_first_name: form.first.trim(), child_last_name: form.last.trim(),
      child_dob: form.dob || null,
    });
    setBusy(false);
    if (error) return alert(error.message);
    setForm({ first: "", last: "", dob: "" });
    load();
  }

  const pending = regs.filter((r) => r.status === "pending");

  if (loading) return <div className="muted">Loading…</div>;

  const registerCard = (
    <div className="card pad">
      <div className="eyebrow" style={{ marginBottom: 12 }}>Register a child</div>
      <form onSubmit={register}>
        <div className="two">
          <div className="field"><label>First name</label><input className="input" value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} required /></div>
          <div className="field"><label>Last name</label><input className="input" value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} required /></div>
        </div>
        <div className="field"><label>Date of birth</label><input className="input" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
        <button className="btn primary block" disabled={busy}><UserPlus size={16} /> Submit registration</button>
      </form>
    </div>
  );

  const list = (
    <>
      {players.map((p) => {
        const a = attendanceFor(att, p.id); const g = goalsFor(stats, p.id);
        return (
        <div key={p.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div className="avatar" style={{ background: "#167D6B", width: 48, height: 48 }}>{initials(p.first_name, p.last_name)}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 18 }}>{p.first_name} {p.last_name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{a.pct === null ? "No attendance yet" : `${a.pct}% attendance`}{g.goals ? ` · ${g.goals} goals` : ""}{g.assists ? ` · ${g.assists} assists` : ""}</div></div>
          <span className="chip oasis"><CheckCircle2 size={13} /> Active</span>
        </div>
      );})}
      {pending.map((r) => (
        <div key={r.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div className="avatar" style={{ background: "var(--night3)", width: 48, height: 48 }}>{initials(r.child_first_name, r.child_last_name)}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 18 }}>{r.child_first_name} {r.child_last_name}</div>
            <div className="muted" style={{ fontSize: 13 }}>Registration under review</div></div>
          <span className="chip gold"><Clock size={13} /> Pending</span>
        </div>
      ))}
      {players.length === 0 && pending.length === 0 && (
        <div className="card"><Empty icon={Users} title="No children yet" body="Register your first child below — an admin will review and place them on a team." /></div>
      )}
    </>
  );

  if (view === "children") return <div><div className="eyebrow" style={{ marginBottom: 12 }}>My children</div>{list}<div style={{ marginTop: 8 }}>{registerCard}</div></div>;

  return (
    <>
      <div className="card pad" style={{ marginBottom: 18, background: "linear-gradient(135deg,#17223B,#2B3D62)", color: "#fff", border: "none" }}>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Welcome</div>
        <h2 style={{ fontSize: 26, marginTop: 4 }}>Your family portal</h2>
        <p style={{ color: "#C6CEDC", marginTop: 6 }}>
          {players.length ? `${players.length} child${players.length > 1 ? "ren" : ""} in the pride.` : pending.length ? "Your registration is under review." : "Register your first child to get started."}
        </p>
      </div>
      <div className="two">
        <div><div className="eyebrow" style={{ marginBottom: 12 }}>My children</div>{list}</div>
        <div>{registerCard}</div>
      </div>
    </>
  );
}
