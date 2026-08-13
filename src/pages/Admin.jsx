import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Empty, initials } from "../lib/ui";
import {
  Users, ClipboardCheck, Inbox, Plus, Check, ShieldCheck, ArrowLeft,
  ChevronDown, HeartPulse, Phone, FileSignature, AlertTriangle, X,
  CreditCard, Wallet, DollarSign,
} from "lucide-react";

function Check2({ done, label, cta, onCta }) {
  return (
    <div className="row">
      <div className="avatar" style={{ width: 26, height: 26, borderRadius: 8, background: done ? "var(--oasis)" : "#fff", border: done ? "none" : "2px solid var(--line2)", color: "#fff" }}>{done && <Check size={14} />}</div>
      <div style={{ flex: 1, fontWeight: 700, textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "inherit" }}>{label}</div>
      {!done && <button className="btn ghost sm" onClick={onCta}>{cta}</button>}
    </div>
  );
}

export default function Admin({ view, go }) {
  const [teams, setTeams] = useState([]);
  const [regs, setRegs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [t, r, p, pr, cs] = await Promise.all([
      supabase.from("teams").select("*").order("created_at"),
      supabase.from("registrations").select("*").order("submitted_at", { ascending: false }),
      supabase.from("players").select("*"),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("club_settings").select("*").eq("id", 1).single(),
    ]);
    setTeams(t.data || []); setRegs(r.data || []); setPlayers(p.data || []); setProfiles(pr.data || []);
    setSettings(cs.data || null);
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

  async function saveFee(dollars) {
    const cents = Math.round(Number(dollars || 0) * 100);
    if (Number.isNaN(cents) || cents < 0) return alert("Enter a valid amount.");
    const { error } = await supabase.from("club_settings").update({ registration_fee_cents: cents, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return alert(error.message);
    load();
  }

  // mark a pending/approved registration as paid (e.g. parent paid cash)
  async function markPaid(reg) {
    await supabase.from("registrations").update({ payment_status: "paid", payment_method: "cash", paid_at: new Date().toISOString() }).eq("id", reg.id);
    if (reg.player_id) await supabase.from("players").update({ payment_status: "paid" }).eq("id", reg.player_id);
    load();
  }

  // ---------- approve / decline ----------
  // Everything the family disclosed travels onto the player record, so a coach
  // has the medical detail and emergency numbers on the sideline.
  async function approve(reg, teamId) {
    const { data: player, error: e1 } = await supabase.from("players").insert({
      parent_id: reg.parent_id, team_id: teamId || null,
      first_name: reg.child_first_name, last_name: reg.child_last_name, date_of_birth: reg.child_dob,
      position: reg.preferred_position || null,
      medical_notes: reg.medical_notes,
      allergies: reg.allergies,
      medications: reg.medications,
      physician_name: reg.physician_name,
      physician_phone: reg.physician_phone,
      insurance_provider: reg.insurance_provider,
      emergency_contact_name: reg.emergency_contact_name,
      emergency_contact_phone: reg.emergency_contact_phone,
      emergency_contact_relation: reg.emergency_contact_relation,
      second_contact_name: reg.second_contact_name,
      second_contact_phone: reg.second_contact_phone,
      medical_treatment_consent: !!reg.medical_treatment_consent,
      parent_phone: reg.parent_phone,
      payment_status: reg.payment_status,
      photo_consent: !!reg.photo_consent,
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
    <>
      <button className="backlink" onClick={() => go("dash")}><ArrowLeft size={15} /> Dashboard</button>
      <Registrations pending={pending} decided={regs.filter((r) => r.status !== "pending")} teams={teams} onApprove={approve} onDecline={decline} onMarkPaid={markPaid} currency={settings?.currency || "usd"} />
    </>
  );
  if (view === "teams") return (
    <>
      <button className="backlink" onClick={() => go("dash")}><ArrowLeft size={15} /> Dashboard</button>
      <TeamsAdmin teams={teams} players={players} profiles={profiles} countFor={countFor} onCreate={createTeam} onUpdate={updateTeam} />
    </>
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
      <FeeCard settings={settings} onSave={saveFee} />
    </>
  );
}

function money(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function FeeCard({ settings, onSave }) {
  const [val, setVal] = useState(((settings?.registration_fee_cents || 0) / 100).toString());
  const cur = settings?.currency || "usd";
  return (
    <div className="card pad" style={{ marginTop: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Registration fee</div>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 }}>
        What each family pays to register a child. Set it to <b>0</b> for free registration.
        Families choose “pay online” (coming soon) or “pay the club directly”; you can mark cash
        payments received on each registration.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ marginBottom: 0, flex: "1 1 160px" }}>
          <label>Fee amount ({cur.toUpperCase()})</label>
          <div style={{ position: "relative" }}>
            <DollarSign size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
            <input className="input" style={{ paddingLeft: 36 }} type="number" min="0" step="0.01" value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
        </div>
        <button className="btn primary" onClick={() => onSave(val)}><Check size={15} /> Save fee</button>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Current: <b>{money(settings?.registration_fee_cents || 0, cur)}</b>
        {settings?.payments_live ? " · online payments live" : " · online card payments not connected yet"}
      </p>
    </div>
  );
}

function TeamsAdmin({ teams, players, profiles, countFor, onCreate, onUpdate }) {
  if (teams.length === 0)
    return <div><div className="card"><Empty icon={ShieldCheck} title="No teams yet" body="Create your first team, then name it and assign a coach." cta="Create a team" onCta={onCreate} /></div></div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
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
                {(p.allergies || p.medications || p.medical_notes) && (
                  <span className="chip clay"><HeartPulse size={12} /> Medical</span>
                )}
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

function Registrations({ pending, decided, teams, onApprove, onDecline, onMarkPaid, currency }) {
  if (pending.length === 0 && decided.length === 0)
    return <div className="card"><Empty icon={Inbox} title="No registrations yet" body="When a family registers a child, it appears here with their medical details and signed waiver for you to review." /></div>;
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Pending · {pending.length}</div>
      {pending.length === 0
        ? <div className="card pad" style={{ marginBottom: 20 }}><div className="muted">All caught up.</div></div>
        : <div style={{ marginBottom: 20 }}>
            {pending.map((r) => <PendingCard key={r.id} r={r} teams={teams} onApprove={onApprove} onDecline={onDecline} onMarkPaid={onMarkPaid} currency={currency} />)}
          </div>}
      {decided.length > 0 && (<>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Reviewed</div>
        <div className="card pad">
          {decided.map((r) => (
            <div key={r.id} className="row">
              <div className="avatar" style={{ background: "var(--night3)" }}>{initials(r.child_first_name, r.child_last_name)}</div>
              <div style={{ flex: 1, fontWeight: 700, minWidth: 0 }}>{r.child_first_name} {r.child_last_name}</div>
              <span className={"chip " + (r.status === "approved" ? "oasis" : "line")}>{r.status}</span>
            </div>
          ))}
        </div>
      </>)}
    </>
  );
}

function PendingCard({ r, teams, onApprove, onDecline, onMarkPaid, currency }) {
  const [tid, setTid] = useState(teams[0]?.id || "");
  const [open, setOpen] = useState(false);
  const hasMedical = r.has_medical_conditions || r.allergies || r.medications || r.medical_notes;
  const waiverOk = r.waiver_accepted;   // one acknowledgment covers the whole agreement

  return (
    <div className="card pad" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div className="avatar" style={{ background: "var(--night3)" }}>{initials(r.child_first_name, r.child_last_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 18 }}>{r.child_first_name} {r.child_last_name}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {r.child_dob ? `Born ${r.child_dob}` : "Date of birth not given"}
            {r.preferred_position ? ` · prefers ${r.preferred_position}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {hasMedical && <span className="chip clay"><HeartPulse size={12} /> Medical info</span>}
            {waiverOk
              ? <span className="chip oasis"><FileSignature size={12} /> Waiver signed</span>
              : <span className="chip clay"><AlertTriangle size={12} /> Not signed</span>}
            {r.photo_consent ? <span className="chip line">Photos OK</span> : <span className="chip line">No photos</span>}
            <PayChip r={r} currency={currency} />
          </div>
        </div>
      </div>

      <button className="readmore" onClick={() => setOpen(!open)} type="button" style={{ marginTop: 12 }}>
        {open ? "Hide details" : "View full registration"}
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", verticalAlign: "middle", marginLeft: 4 }} />
      </button>

      {open && <RegDetail r={r} />}

      {!waiverOk && (
        <div className="flag" style={{ marginTop: 14 }}>
          <AlertTriangle size={16} style={{ flex: "none" }} />
          <span>This family has not agreed to every required item. Ask them to complete it before the child takes the field.</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Assign to</span>
        <select className="input" value={tid} onChange={(e) => setTid(e.target.value)} style={{ width: "auto", padding: "8px 10px", flex: "1 1 140px" }}>
          {teams.length === 0 && <option value="">No teams — create one first</option>}
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name || "Untitled team"}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {(r.payment_status === "pay_later" || r.payment_status === "unpaid") && r.fee_amount_cents > 0 && (
            <button className="btn ghost sm" onClick={() => onMarkPaid(r)}><Wallet size={14} /> Mark paid</button>
          )}
          <button className="btn ghost sm" onClick={() => onDecline(r.id)}><X size={14} /> Decline</button>
          <button className="btn oasis sm" onClick={() => onApprove(r, tid)}><Check size={14} /> Approve</button>
        </div>
      </div>
    </div>
  );
}

function moneyA(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function PayChip({ r, currency }) {
  if (r.fee_amount_cents === 0 || r.payment_status === "waived") return <span className="chip line">No fee</span>;
  if (r.payment_status === "paid") return <span className="chip oasis"><Check size={12} /> Paid</span>;
  if (r.payment_status === "pay_later") return <span className="chip gold"><Wallet size={12} /> Pay at club</span>;
  return <span className="chip clay"><CreditCard size={12} /> Unpaid</span>;
}

function RegDetail({ r }) {
  const val = (v) => v ? <dd>{v}</dd> : <dd className="none">Not given</dd>;
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
      <div className="sect">
        <h5><HeartPulse size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Medical</h5>
        {r.has_medical_conditions
          ? <div className="flag"><HeartPulse size={15} style={{ flex: "none" }} /><span>Parent flagged a medical condition — read the notes below.</span></div>
          : <div className="flag ok"><Check size={15} style={{ flex: "none" }} /><span>No medical conditions declared.</span></div>}
        <dl className="dl">
          <dt>Allergies</dt>{val(r.allergies)}
          <dt>Medication</dt>{val(r.medications)}
          <dt>Notes</dt>{val(r.medical_notes)}
          <dt>Doctor</dt>{val(r.physician_name)}
          <dt>Doctor phone</dt>{val(r.physician_phone)}
          <dt>Insurance</dt>{val(r.insurance_provider)}
        </dl>
      </div>

      <div className="sect">
        <h5><Phone size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Contacts</h5>
        <dl className="dl">
          <dt>Parent phone</dt>
          {r.parent_phone
            ? <dd><a href={`tel:${r.parent_phone}`} style={{ color: "var(--sunset)" }}>{r.parent_phone}</a></dd>
            : <dd className="none">Not given</dd>}
          <dt>Contact</dt>{val(r.emergency_contact_name)}
          <dt>Phone</dt>
          {r.emergency_contact_phone
            ? <dd><a href={`tel:${r.emergency_contact_phone}`} style={{ color: "var(--sunset)" }}>{r.emergency_contact_phone}</a></dd>
            : <dd className="none">Not given</dd>}
          <dt>Relationship</dt>{val(r.emergency_contact_relation)}
          <dt>Second</dt>{val(r.second_contact_name)}
          <dt>Second phone</dt>
          {r.second_contact_phone
            ? <dd><a href={`tel:${r.second_contact_phone}`} style={{ color: "var(--sunset)" }}>{r.second_contact_phone}</a></dd>
            : <dd className="none">Not given</dd>}
        </dl>
      </div>

      <div className="sect">
        <h5><CreditCard size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Payment</h5>
        <dl className="dl">
          <dt>Fee</dt><dd>{r.fee_amount_cents ? moneyA(r.fee_amount_cents) : "No fee"}</dd>
          <dt>Status</dt>
          <dd>{r.payment_status === "paid" ? "Paid" : r.payment_status === "pay_later" ? "To pay the club directly" : r.payment_status === "waived" ? "Waived" : "Unpaid"}</dd>
          <dt>Method</dt>{r.payment_method ? <dd>{r.payment_method}</dd> : <dd className="none">—</dd>}
          <dt>Paid on</dt>{r.paid_at ? <dd>{new Date(r.paid_at).toLocaleString()}</dd> : <dd className="none">—</dd>}
        </dl>
      </div>

      <div className="sect">
        <h5><FileSignature size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Agreements</h5>
        <dl className="dl">
          <dt>Waiver &amp; agreement</dt>
          <dd>{r.waiver_accepted ? "Signed — sections 1–6 and 8" : "Not signed"}</dd>
          <dt>Photos &amp; video</dt>
          <dd>{r.photo_consent ? "Permission given" : "Permission declined — do not publish"}</dd>
          <dt>Signed by</dt>{val(r.waiver_signed_name)}
          <dt>Signed on</dt>{val(r.waiver_signed_at ? new Date(r.waiver_signed_at).toLocaleString() : null)}
          <dt>Version</dt>{val(r.waiver_version)}
        </dl>
      </div>
    </div>
  );
}
