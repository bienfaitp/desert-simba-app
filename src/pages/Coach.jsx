import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { Empty, initials } from "../lib/ui";
import { attendanceFor, goalsFor } from "../lib/stats";
import { Users, ClipboardCheck, Trophy, Check, ChevronLeft, FileText, HeartPulse } from "lucide-react";

export default function Coach({ view, go }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [att, setAtt] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    const { data: t } = await supabase.from("teams").select("*").eq("coach_id", user.id);
    const teamIds = (t || []).map((x) => x.id);
    let pl = [];
    if (teamIds.length) {
      const { data } = await supabase.from("players").select("*").in("team_id", teamIds);
      pl = data || [];
    }
    const { data: a } = await supabase.from("attendance").select("*");
    const { data: s } = await supabase.from("match_stats").select("*");
    setTeams(t || []); setPlayers(pl); setAtt(a || []); setStats(s || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="muted">Loading…</div>;

  if (teams.length === 0)
    return <div className="card"><Empty icon={ClipboardCheck} title="No team assigned yet" body="An admin needs to assign you as head coach of a team before your roster appears here." /></div>;

  if (selected) {
    const p = players.find((x) => x.id === selected);
    if (p) return <PlayerProfile player={p} att={att} stats={stats} onBack={() => setSelected(null)} onSaved={load} />;
  }

  if (view === "players")
    return <Roster players={players} att={att} stats={stats} onOpen={setSelected} />;

  if (view === "attendance")
    return <Attendance teams={teams} players={players} onSaved={load} />;

  if (view === "matches")
    return <div className="card"><Empty icon={Trophy} title="Matches" body="Match scheduling and stats are coming soon." /></div>;

  const totalPlayers = players.length;
  const stat = [
    ["Players", totalPlayers, Users, "#E1571E"],
    ["Teams", teams.length, ClipboardCheck, "#167D6B"],
  ];
  return (
    <>
      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Your squads</div>
        <h2 style={{ fontSize: 24, marginBottom: 4 }}>Coach dashboard</h2>
        <p className="muted">{teams.map((t) => t.name || "Untitled team").join(", ")}</p>
      </div>
      <div className="stats">
        {stat.map(([l, v, I, c]) => (
          <div key={l} className="stat"><div className="ic" style={{ background: c + "22", color: c }}><I size={18} /></div><div className="v">{v}</div><div className="l">{l}</div></div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Your players</div>
        <Roster players={players} att={att} stats={stats} onOpen={setSelected} />
      </div>
    </>
  );
}

function Roster({ players, att, stats, onOpen }) {
  if (players.length === 0)
    return <div className="card"><Empty icon={Users} title="No players yet" body="Once an admin approves registrations onto your team, they'll appear here." /></div>;
  return (
    <div className="two">
      {players.map((p) => {
        const a = attendanceFor(att, p.id); const g = goalsFor(stats, p.id);
        const hasMedical = p.allergies || p.medications || p.medical_notes;
        return (
          <button key={p.id} className="card pad" style={{ textAlign: "left", display: "flex", gap: 14, alignItems: "center" }} onClick={() => onOpen(p.id)}>
            <div className="avatar" style={{ background: "#167D6B", width: 46, height: 46 }}>{initials(p.first_name, p.last_name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 17 }}>{p.first_name} {p.last_name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{a.pct === null ? "No attendance" : `${a.pct}% present`}{g.goals ? ` · ${g.goals}G` : ""}</div>
            </div>
            {hasMedical && <span className="chip clay"><HeartPulse size={12} /> Medical</span>}
          </button>
        );
      })}
    </div>
  );
}

function PlayerProfile({ player, att, stats, onBack, onSaved }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const a = attendanceFor(att, player.id);
  const g = goalsFor(stats, player.id);

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    await supabase.from("coach_comments").insert({ player_id: player.id, body: note.trim() });
    setNote(""); setSaving(false); onSaved && onSaved();
  }

  return (
    <div>
      <button className="backlink" onClick={onBack}><ChevronLeft size={15} /> Back to roster</button>
      <div className="card pad" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div className="avatar" style={{ background: "#167D6B", width: 60, height: 60, fontSize: 20 }}>{initials(player.first_name, player.last_name)}</div>
        <div>
          <div style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: 22 }}>{player.first_name} {player.last_name}</div>
          <div className="muted" style={{ fontSize: 14 }}>{a.pct === null ? "No attendance yet" : `${a.pct}% attendance`}{g.goals ? ` · ${g.goals} goals` : ""}{g.assists ? ` · ${g.assists} assists` : ""}</div>
        </div>
      </div>

      <SafetyCard p={player} />

      <div className="card pad">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Coach comment</div>
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Feedback on ${player.first_name}'s progress…`} />
        <button className="btn primary sm" style={{ marginTop: 10 }} onClick={saveNote} disabled={saving}><FileText size={14} /> {saving ? "Saving…" : "Save comment"}</button>
      </div>
    </div>
  );
}

function Attendance({ teams, players, onSaved }) {
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function save() {
    setSaving(true);
    const rows = Object.entries(marks).map(([player_id, status]) => ({ player_id, date: today, status }));
    if (rows.length) await supabase.from("attendance").insert(rows);
    setSaving(false); setMarks({}); onSaved && onSaved();
  }

  if (players.length === 0)
    return <div className="card"><Empty icon={ClipboardCheck} title="No players" body="No players to mark attendance for yet." /></div>;

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Attendance · {today}</div>
      <div className="card pad">
        {players.map((p) => (
          <div key={p.id} className="row">
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, background: "var(--night3)" }}>{initials(p.first_name, p.last_name)}</div>
            <div style={{ flex: 1, fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["present", "late", "absent"].map((s) => (
                <button key={s} className={"chip " + (marks[p.id] === s ? "oasis" : "line")} onClick={() => setMarks({ ...marks, [p.id]: s })} style={{ cursor: "pointer", textTransform: "capitalize" }}>{s}</button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn primary block" style={{ marginTop: 14 }} onClick={save} disabled={saving || Object.keys(marks).length === 0}>
          <Check size={16} /> {saving ? "Saving…" : "Save attendance"}
        </button>
      </div>
    </div>
  );
}

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
