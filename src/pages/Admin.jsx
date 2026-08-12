import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Empty, initials } from "../lib/ui";
import {
  Users, ClipboardCheck, Inbox, Plus, Check, ShieldCheck, ArrowLeft,
  ChevronDown, HeartPulse, Phone, FileSignature, AlertTriangle, X,
  CreditCard, Wallet, DollarSign,
} from "lucide-react";

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

  async function markPaid(reg) {
    await supabase.from("registrations").update({ payment_status: "paid", payment_method: "cash", paid_at: new Date().toISOString() }).eq("id", reg.id);
    if (reg.player_id) await supabase.from("players").update({ payment_status: "paid" }).eq("id", reg.player_id);
    load();
  }

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
          <div key={l} className="stat">
            <div className="ic" style={{ background: c + "22", color: c }}><I size={20} /></div>
            <div>
              <b style={{ fontSize: 20 }}>{v}</b>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{l}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
