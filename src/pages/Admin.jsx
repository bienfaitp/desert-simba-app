import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Empty, initials } from "../lib/ui";
import { Users, ClipboardCheck, Inbox, Plus, Check, ShieldCheck, MapPin } from "lucide-react";

export default function Admin({ view, go }) {
  const [teams, setTeams] = useState([]);
  const [regs, setRegs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [t, r, p, pr] = await Promise.all([
      supabase.from("teams").select("*").order("created_at"),
      supabase.from("registrations").select("*").order("submitted_at", { ascending: false }),
      supabase.from("players").select("*"),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    setTeams(t.data || []); setRegs(r.data || []); setPlayers(p.data || []); setProfiles(pr.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="muted">Loading…</div>;
  const pending = regs.filter((r) => r.status === "pending");
  const countFor = (tid) => players.filter((p) => p.team_id === tid).length;

  // ---------- create / edit teams ----------
  async function createTeam() {
    const { error } = await supabase.from("teams").insert({ name: "", age_group: "" });
    if (error) return alert(error.message);
    load();
  }
  async function updateTeam(id, patch) {
    const { error } = await supabase.from("teams").update(patch).eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  // ---------- approve / decline ----------
  async function approve(reg, teamId) {
    const { data: player, error: e1 } = await supabase.from("players").insert({
      parent_id: reg.parent_id, team_id: teamId || null,
      first_name: reg.child_first_name, last_name: reg.child_last_name, date_of_birth: reg.child_dob,
    }).select().single();
    if (e1) return alert(e1.message);
    const { error: e2 } = await supabase.from("registrations")
      .update({ status: "approved", player_id: player.id, reviewed_at: new Date().toISOString() }).eq("id", reg.id);
    if (e2) return alert(e2.message);
    load();
  }
  async function decline(id) {
    await supabase.from("registrations").update({ status: "declined", reviewed_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  if (view === "regs") return (
    <Registrations pending={pending} decided={regs.filter((r) => r.status !== "pending")} teams={teams} onApprove={approve} onDecline={decline} />
  );
  if (view === "teams") return (
    <TeamsAdmin teams={teams} players={players} profiles={profiles} countFor={countFor} onCreate={createTeam} onUpdate={updateTeam} />
  );

  // ---------- dashboard ----------
  const teamsNamed = teams.length > 0 && teams.every((t) => t.name?.trim());
  const stats = [
    ["Active players", players.length, Users, "#E1571E"],
    ["Pending approvals", pending.length, ClipboardCheck, "#E9A62C"],
    ["Teams", teams.length, ShieldCheck, "#167D6B"],
  ];
  return (
    <>
      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Set up your club</div>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Welcome, admin</h2>
        <Check2 done={teams.length > 0} label="Create your teams" cta="Teams" onCta={() => go("teams")} />
        <Check2 done={teamsNamed} label="Name every team" cta="Teams" onCta={() => go("teams")} />
        <Check2 done={players.length > 0} label="Approve your first registration" cta="Registrations" onCta={() => go("regs")} />
      </div>
      <div className="stats">
        {stats.map(([l, v, I, c]) => (
          <div key={l} className="stat"><div className="ic" style={{ background: c + "22", color: c }}><I size={18} /></div><div className="v">{v}</div><div className="l">{l}</div></div>
        ))}
      </div>
    </>
  );
}

function Check2({ done, label, cta, onCta }) {
  return (
    <div className="row">
      <div className="avatar" style={{ width: 26, height: 26, borderRadius: 8, background: done ? "var(--oasis)" : "#fff", border: done ? "none" : "2px solid var(--line2)", color: "#fff" }}>{done && <Check size={14} />}</div>
      <div style={{ flex: 1, fontWeight: 700, textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "inherit" }}>{label}</div>
      {!done && <button className="btn ghost sm" onClick={onCta}>{cta}</button>}
    </div>
  );
}

function TeamsAdmin({ teams, players, profiles, countFor, onCreate, onUpdate }) {
  if (teams.length === 0)
    return <div><div className="card"><Empty icon={ShieldCheck} title="No teams yet" body="Create your first team, then name it and assign a coach." cta="Create a team" onCta={onCreate} /></div></div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="eyebrow">Teams</div>
        <button className="btn ghost sm" onClick={onCreate}><Plus size={14} /> Add team</button>
      </div>
      <div className="two">
        {teams.map((t) => (
          <div key={t.id} className="card pad">
            <div className="field"><label>Team name</label>
              <input className="input" defaultValue={t.name} placeholder="e.g. Sahara Pride" onBlur={(e) => e.target.value !== t.name && onUpdate(t.id, { name: e.target.value })} /></div>
            <div className="two">
              <div className="field"><label>Age group</label>
                <select className="input" defaultValue={t.age_group || ""} onChange={(e) => onUpdate(t.id, { age_group: e.target.value })}>
                  <option value="">—</option>{["U6", "U8", "U10", "U12", "U14", "U16"].map((a) => <option key={a}>{a}</option>)}
                </select></div>
              <div className="field"><label>Head coach</label>
                <select className="input" defaultValue={t.coach_id || ""} onChange={(e) => onUpdate(t.id, { coach_id: e.target.value || null })}>
                  <option value="">Unassigned</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select></div>
            </div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{countFor(t.id)} of {t.capacity} players</div>
            {players.filter((p) => p.team_id === t.id).map((p) => (
              <div key={p.id} className="row" style={{ padding: "8px 0" }}>
                <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: "var(--night3)" }}>{initials(p.first_name, p.last_name)}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
        Assigning a coach here activates their coach dashboard for that team. (Coaches sign up like anyone else; the first-ever account is the admin.)
      </p>
    </div>
  );
}

function Registrations({ pending, decided, teams, onApprove, onDecline }) {
  if (pending.length === 0 && decided.length === 0)
    return <div className="card"><Empty icon={Inbox} title="No registrations yet" body="When a family registers a child, it appears here for you to approve and place on a team." /></div>;
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Pending · {pending.length}</div>
      <div className="card pad" style={{ marginBottom: 20 }}>
        {pending.length === 0 ? <div className="muted" style={{ padding: "8px 0" }}>All caught up.</div>
          : pending.map((r) => <PendingRow key={r.id} r={r} teams={teams} onApprove={onApprove} onDecline={onDecline} />)}
      </div>
      {decided.length > 0 && (<>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Reviewed</div>
        <div className="card pad">
          {decided.map((r) => (
            <div key={r.id} className="row">
              <div className="avatar" style={{ background: "var(--night3)" }}>{initials(r.child_first_name, r.child_last_name)}</div>
              <div style={{ flex: 1, fontWeight: 700 }}>{r.child_first_name} {r.child_last_name}</div>
              <span className={"chip " + (r.status === "approved" ? "oasis" : "line")}>{r.status}</span>
            </div>
          ))}
        </div>
      </>)}
    </>
  );
}

function PendingRow({ r, teams, onApprove, onDecline }) {
  const [tid, setTid] = useState(teams[0]?.id || "");
  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="avatar" style={{ background: "var(--night3)" }}>{initials(r.child_first_name, r.child_last_name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{r.child_first_name} {r.child_last_name}</div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{r.child_dob || "DOB not given"}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Assign to</span>
          <select className="input" value={tid} onChange={(e) => setTid(e.target.value)} style={{ width: "auto", padding: "8px 10px" }}>
            {teams.length === 0 && <option value="">No teams — create one first</option>}
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name || "Untitled team"}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn ghost sm" onClick={() => onDecline(r.id)}>Decline</button>
        <button className="btn oasis sm" onClick={() => onApprove(r, tid)}><Check size={14} /> Approve</button>
      </div>
    </div>
  );
}
