import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { Empty, initials } from "../lib/ui";
import { attendanceFor, goalsFor, wdl } from "../lib/stats";
import { Users, ClipboardCheck, Trophy, Check, ChevronLeft, FileText, HeartPulse } from "lucide-react";

const AVATAR = ["#E1571E", "#167D6B", "#E9A62C", "#2B3D62"];

export default function Coach({ view }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [att, setAtt] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);

  async function load() {
    setLoading(true);
    const [p, t, a, m, s] = await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("teams").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("matches").select("*").order("played_on", { ascending: false }),
      supabase.from("match_stats").select("*"),
    ]);
    setPlayers(p.data || []); setTeams(t.data || []); setAtt(a.data || []);
    setMatches(m.data || []); setStats(s.data || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="muted">Loading…</div>;

  const myTeams = teams.filter((t) => t.coach_id === user.id || t.assistant_coach_id === user.id);
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "Team";
  const teamColor = (id) => { const i = teams.findIndex((t) => t.id === id); return AVATAR[(i < 0 ? 0 : i) % AVATAR.length]; };

  if (sel) return <PlayerProfile player={sel} att={att} stats={stats} teamName={teamName} color={teamColor(sel.team_id)} onBack={() => setSel(null)} onSaved={load} />;
  if (view === "players") return <Roster players={players} teamName={teamName} teamColor={teamColor} att={att} stats={stats} onOpen={setSel} />;
  if (view === "attendance") return <Attendance players={players} teamName={teamName} teamColor={teamColor} uid={user.id} onSaved={load} />;
  if (view === "matches") return <Matches myTeams={myTeams} players={players} matches={matches} uid={user.id} teamName={teamName} onSaved={load} />;

  const sessionDates = [...new Set(att.map((a) => a.session_date))];
  return (
    <>
      <div className="stats" style={{ marginBottom: 18 }}>
        {[["Players", players.length, Users, "#E1571E"], ["Sessions", sessionDates.length, ClipboardCheck, "#167D6B"], ["Matches", matches.length, Trophy, "#E9A62C"]].map(([l, v, I, c]) => (
          <div key={l} className="stat"><div className="ic" style={{ background: c + "22", color: c }}><I size={18} /></div><div className="v">{v}</div><div className="l">{l}</div></div>
        ))}
      </div>
      {players.length === 0
        ? <div className="card"><Empty icon={Users} title="No players yet" body="Ask an admin to set you as a team's Head coach and approve registrations onto it — your roster then appears here." /></div>
        : <Roster players={players} teamName={teamName} teamColor={teamColor} att={att} stats={stats} onOpen={setSel} />}
    </>
  );
}

function Roster({ players, teamName, teamColor, att, stats, onOpen }) {
  return (
    <div className="card pad">
      <div className="eyebrow" style={{ marginBottom: 10 }}>Roster · {players.length}</div>
      {players.map((p) => {
        const a = attendanceFor(att, p.id); const g = goalsFor(stats, p.id);
        return (
          <div key={p.id} className="row">
            <div className="avatar" style={{ background: teamColor(p.team_id) }}>{initials(p.first_name, p.last_name)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{teamName(p.team_id)}{a.pct !== null ? ` · ${a.pct}% att` : ""}{g.goals ? ` · ${g.goals}G` : ""}{g.assists ? ` ${g.assists}A` : ""}</div></div>
            <button className="btn ghost sm" onClick={() => onOpen(p)}>Profile</button>
          </div>
        );
      })}
    </div>
  );
}

function PlayerProfile({ player, att, stats, teamName, color, onBack, onSaved }) {
  const a = attendanceFor(att, player.id); const g = goalsFor(stats, player.id);
  const [note, setNote] = useState(player.comment || "");
  const [saved, setSaved] = useState(false);
  async function save() {
    const { error } = await supabase.from("players").update({ comment: note }).eq("id", player.id);
    if (error) return alert(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 1800); onSaved && onSaved();
  }
  return (
    <>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}><ChevronLeft size={15} /> Roster</button>
      <div className="card pad" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div className="avatar" style={{ background: color, width: 64, height: 64, fontSize: 20 }}>{initials(player.first_name, player.last_name)}</div>
        <div style={{ flex: 1, minWidth: 180 }}><h2 style={{ fontSize: 26 }}>{player.first_name} {player.last_name}</h2><div className="muted">{teamName(player.team_id)}{player.position ? ` · ${player.position}` : ""}</div></div>
      </div>
      <div className="stats" style={{ marginBottom: 16 }}>
        {[["Goals", g.goals, "#E1571E"], ["Assists", g.assists, "#167D6B"], ["Attendance", a.pct === null ? "—" : a.pct + "%", "#E9A62C"], ["Sessions", a.total, "#2B3D62"]].map(([l, v, c]) => (
          <div key={l} className="stat"><div className="v" style={{ color: c }}>{v}</div><div className="l">{l}</div></div>
        ))}
      </div>
      <SafetyCard p={player} />

      <div className="card pad">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Coach comment</div>
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Feedback on ${player.first_name}'s progress…`} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button className="btn primary sm" onClick={save}><Check size={15} /> Save comment</button>
          {saved && <span className="chip oasis"><Check size={13} /> Saved</span>}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Goals and assists come from recorded matches; attendance is live from your sessions.</p>
      </div>
    </>
  );
}

function Attendance({ players, teamName, teamColor, uid, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState(() => Object.fromEntries(players.map((p) => [p.id, "present"])));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const counts = { present: 0, late: 0, excused: 0, absent: 0 };
  players.forEach((p) => counts[marks[p.id] || "present"]++);

  async function save() {
    setBusy(true);
    const rows = players.map((p) => ({ player_id: p.id, team_id: p.team_id, session_date: date, status: marks[p.id] || "present", recorded_by: uid }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "player_id,session_date" });
    setBusy(false);
    if (error) return alert(error.message);
    setSaved(true); onSaved && onSaved();
  }
  if (players.length === 0) return <div className="card"><Empty icon={ClipboardCheck} title="No players to check in" body="You'll be able to take attendance once players are on your roster." /></div>;
  const labels = [["present", "Present"], ["late", "Late"], ["excused", "Excused"], ["absent", "Absent"]];
  return (
    <>
      <div className="card pad" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="eyebrow">Session date</div>
        <input className="input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} style={{ width: "auto" }} />
        <button className="btn oasis sm" style={{ marginLeft: "auto" }} onClick={save} disabled={busy || saved}>{saved ? <><Check size={15} /> Saved</> : <><FileText size={15} /> {busy ? "Saving…" : "Save session"}</>}</button>
      </div>
      <div className="card pad">
        {players.map((p) => (
          <div key={p.id} className="row">
            <div className="avatar" style={{ background: teamColor(p.team_id), width: 38, height: 38, fontSize: 13 }}>{initials(p.first_name, p.last_name)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div><div className="muted" style={{ fontSize: 12 }}>{teamName(p.team_id)}</div></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {labels.map(([k, lab]) => (
                <button key={k} onClick={() => { setMarks((m) => ({ ...m, [p.id]: k })); setSaved(false); }} style={mBtn(marks[p.id] === k, k)}>{lab}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="card pad" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Summary</div>
        <div className="stats">
          {[["Present", counts.present, "#167D6B"], ["Late", counts.late, "#E9A62C"], ["Excused", counts.excused, "#2B3D62"], ["Absent", counts.absent, "#C13B2C"]].map(([l, v, c]) => (
            <div key={l} className="stat"><div className="v" style={{ color: c }}>{v}</div><div className="l">{l}</div></div>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>Rate: <b className="mono" style={{ color: "var(--oasis)" }}>{Math.round(((counts.present + counts.late) / players.length) * 100)}%</b>{saved ? " · saved — feeds each player's profile." : " · save to update profiles."}</div>
      </div>
    </>
  );
}

function Matches({ myTeams, players, matches, uid, teamName, onSaved }) {
  const [tid, setTid] = useState(myTeams[0] ? myTeams[0].id : "");
  const [opp, setOpp] = useState("");
  const [us, setUs] = useState(0);
  const [them, setThem] = useState(0);
  const [sc, setSc] = useState({});
  const [busy, setBusy] = useState(false);
  const roster = players.filter((p) => p.team_id === tid);
  const bump = (pid, key, d) => setSc((s) => { const cur = s[pid] || { g: 0, a: 0 }; return { ...s, [pid]: { ...cur, [key]: Math.max(0, (cur[key] || 0) + d) } }; });

  async function save() {
    if (!tid || !opp.trim()) return;
    setBusy(true);
    const { data: match, error } = await supabase.from("matches").insert({
      team_id: tid, opponent: opp.trim(), our_score: Number(us), opp_score: Number(them), created_by: uid,
    }).select().single();
    if (error) { setBusy(false); return alert(error.message); }
    const rows = roster.map((p) => ({ match_id: match.id, player_id: p.id, goals: sc[p.id]?.g || 0, assists: sc[p.id]?.a || 0 })).filter((r) => r.goals || r.assists);
    if (rows.length) { const { error: e2 } = await supabase.from("match_stats").insert(rows); if (e2) { setBusy(false); return alert(e2.message); } }
    setBusy(false); setOpp(""); setUs(0); setThem(0); setSc({}); onSaved && onSaved();
  }

  if (myTeams.length === 0) return <div className="card"><Empty icon={Trophy} title="No team assigned" body="Ask an admin to set you as a team's Head coach — then you can record matches for it." /></div>;

  return (
    <div className="two">
      <div className="card pad">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Record a match</div>
        <div className="field"><label>Team</label>
          <select className="input" value={tid} onChange={(e) => { setTid(e.target.value); setSc({}); }}>{myTeams.map((t) => <option key={t.id} value={t.id}>{t.name || "Untitled team"}</option>)}</select></div>
        <div className="field"><label>Opponent</label><input className="input" value={opp} onChange={(e) => setOpp(e.target.value)} placeholder="e.g. Cactus United" /></div>
        <div className="two">
          <div className="field"><label>Our score</label><input className="input" type="number" min="0" value={us} onChange={(e) => setUs(e.target.value)} /></div>
          <div className="field"><label>Their score</label><input className="input" type="number" min="0" value={them} onChange={(e) => setThem(e.target.value)} /></div>
        </div>
        {roster.length > 0 && (<>
          <div className="eyebrow" style={{ margin: "6px 0 8px" }}>Goals & assists</div>
          {roster.map((p) => (
            <div key={p.id} className="row" style={{ padding: "10px 0" }}>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{p.first_name} {p.last_name}</div>
              {["g", "a"].map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="mono muted" style={{ fontSize: 11, width: 14 }}>{k.toUpperCase()}</span>
                  <button className="btn ghost sm" style={{ padding: "4px 9px" }} onClick={() => bump(p.id, k, -1)}>–</button>
                  <span className="mono" style={{ width: 16, textAlign: "center", fontWeight: 700 }}>{sc[p.id]?.[k] || 0}</span>
                  <button className="btn ghost sm" style={{ padding: "4px 9px" }} onClick={() => bump(p.id, k, 1)}>+</button>
                </div>
              ))}
            </div>
          ))}
        </>)}
        <button className="btn primary block" style={{ marginTop: 12 }} onClick={save} disabled={busy || !opp.trim()}><Trophy size={16} /> {busy ? "Saving…" : "Save match"}</button>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Recorded matches</div>
        {matches.length === 0
          ? <div className="card"><Empty icon={Trophy} title="No matches yet" body="Record your first result — it flows to player stats." /></div>
          : matches.map((m) => { const r = wdl(m);
            return (
              <div key={m.id} className="card pad" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <span className={"chip " + (r === "W" ? "oasis" : r === "D" ? "gold" : "clay")} style={{ width: 32, justifyContent: "center" }}>{r}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{teamName(m.team_id)} vs {m.opponent}</div><div className="muted" style={{ fontSize: 12 }}>{m.played_on}</div></div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{m.our_score}–{m.opp_score}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function mBtn(on, k) {
  const map = { present: ["#167D6B", "#fff"], late: ["#E9A62C", "#3a2c07"], excused: ["#2B3D62", "#fff"], absent: ["#C13B2C", "#fff"] };
  const pair = map[k];
  return {
    padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700,
    border: "1.5px solid " + (on ? pair[0] : "var(--line2)"),
    background: on ? pair[0] : "#fff", color: on ? pair[1] : "var(--muted)",
  };
}

// Sideline safety card — the medical detail and phone numbers a coach needs
// in the moment, pulled from what the family submitted at registration.
function SafetyCard({ p }) {
  const hasMedical = p.allergies || p.medications || p.medical_notes;
  const call = (num) => <a href={`tel:${num}`} style={{ color: "var(--sunset)", fontWeight: 700 }}>{num}</a>;
  return (
    <div className="card pad" style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Safety</div>

      {hasMedical ? (
        <div className="flag"><HeartPulse size={15} style={{ flex: "none" }} /><span>This player has medical information on file.</span></div>
      ) : (
        <div className="flag ok"><Check size={15} style={{ flex: "none" }} /><span>No medical conditions on file.</span></div>
      )}

      <dl className="dl">
        <dt>Allergies</dt>{p.allergies ? <dd>{p.allergies}</dd> : <dd className="none">None listed</dd>}
        <dt>Medication</dt>{p.medications ? <dd>{p.medications}</dd> : <dd className="none">None listed</dd>}
        <dt>Notes</dt>{p.medical_notes ? <dd>{p.medical_notes}</dd> : <dd className="none">None listed</dd>}
      </dl>

      <div className="sect">
        <h5>In an emergency</h5>
        <dl className="dl">
          <dt>Parent</dt>
          {p.parent_phone ? <dd>{call(p.parent_phone)}</dd> : <dd className="none">Not given</dd>}
          <dt>Call first</dt>
          {p.emergency_contact_name
            ? <dd>{p.emergency_contact_name}{p.emergency_contact_relation ? ` (${p.emergency_contact_relation})` : ""}<br />{p.emergency_contact_phone && call(p.emergency_contact_phone)}</dd>
            : <dd className="none">No emergency contact on file</dd>}
          {p.second_contact_name && (<>
            <dt>Then</dt>
            <dd>{p.second_contact_name}<br />{p.second_contact_phone && call(p.second_contact_phone)}</dd>
          </>)}
          <dt>Doctor</dt>
          {p.physician_name || p.physician_phone
            ? <dd>{p.physician_name}{p.physician_phone ? <><br />{call(p.physician_phone)}</> : null}</dd>
            : <dd className="none">Not given</dd>}
          <dt>Treatment consent</dt>
          <dd>{p.medical_treatment_consent ? "Parent authorised emergency medical assistance" : "Not on file — contact parent before treatment"}</dd>
        </dl>
      </div>

      <div className="sect">
        <h5>Media</h5>
        <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>
          {p.photo_consent
            ? "Photos and video of this player may be shared by the club."
            : "Do not publish photos or video of this player."}
        </p>
      </div>
    </div>
  );
}
