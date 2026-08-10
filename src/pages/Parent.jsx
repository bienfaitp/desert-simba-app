import { useEffect, useState, Fragment } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { Empty, initials } from "../lib/ui";
import { attendanceFor, goalsFor } from "../lib/stats";
import {
  WAIVER_SECTIONS, WAIVER_TITLE, WAIVER_VERSION, PHOTO_CHOICES,
  ACKNOWLEDGEMENT, ACKNOWLEDGEMENT_INTRO, CLUB_NAME,
} from "../lib/waiver";
import {
  UserPlus, Users, CheckCircle2, Clock, ArrowLeft, ArrowRight, ChevronDown,
  HeartPulse, Phone, FileSignature, Baby, ShieldAlert, CreditCard, Wallet,
} from "lucide-react";

const STEPS = [
  ["Child", Baby],
  ["Medical", HeartPulse],
  ["Contacts", Phone],
  ["Agreements", FileSignature],
  ["Payment", CreditCard],
];

const BLANK = {
  first: "", last: "", dob: "", position: "",
  hasMedical: false, allergies: "", medications: "", medicalNotes: "",
  physicianName: "", physicianPhone: "", insurance: "",
  parentPhone: "",
  ecName: "", ecPhone: "", ecRelation: "",
  ec2Name: "", ec2Phone: "",
  photoConsent: null,
  acknowledged: false,
  signature: "",
  payChoice: null,
};

export default function Parent({ view }) {
  const { user, profile } = useAuth();
  const [players, setPlayers] = useState([]);
  const [regs, setRegs] = useState([]);
  const [att, setAtt] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: r }, { data: a }, { data: s }] = await Promise.all([
      supabase.from("players").select("*").eq("parent_id", user.id),
      supabase.from("registrations").select("*").eq("parent_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("attendance").select("*"),
      supabase.from("match_stats").select("*"),
    ]);
    setPlayers(p || []); setRegs(r || []); setAtt(a || []); setStats(s || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const pending = regs.filter((r) => r.status === "pending");
  if (loading) return <div className="muted">Loading…</div>;

  if (adding)
    return (
      <RegistrationWizard
        parentName={profile?.full_name || ""}
        onCancel={() => setAdding(false)}
        onDone={() => { setAdding(false); load(); }}
      />
    );

  const list = (
    <>
      {players.map((p) => {
        const a = attendanceFor(att, p.id); const g = goalsFor(stats, p.id);
        return (
        <div key={p.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div className="avatar" style={{ background: "#167D6B", width: 48, height: 48 }}>{initials(p.first_name, p.last_name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 18 }}>{p.first_name} {p.last_name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{a.pct === null ? "No attendance yet" : `${a.pct}% attendance`}{g.goals ? ` · ${g.goals} goals` : ""}{g.assists ? ` · ${g.assists} assists` : ""}</div></div>
          <span className="chip oasis"><CheckCircle2 size={13} /> Active</span>
        </div>
      );})}
      {pending.map((r) => (
        <div key={r.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div className="avatar" style={{ background: "var(--night3)", width: 48, height: 48 }}>{initials(r.child_first_name, r.child_last_name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontFamily: "var(--disp)", fontSize: 18 }}>{r.child_first_name} {r.child_last_name}</div>
            <div className="muted" style={{ fontSize: 13 }}>Registration under review</div></div>
          <span className="chip gold"><Clock size={13} /> Pending</span>
        </div>
      ))}
      {players.length === 0 && pending.length === 0 && (
        <div className="card"><Empty icon={Users} title="No children yet" body="Register your first child — an admin will review and place them on a team." cta="Register a child" onCta={() => setAdding(true)} /></div>
      )}
    </>
  );

  const addBtn = (players.length > 0 || pending.length > 0) && (
    <button className="btn primary block" onClick={() => setAdding(true)} style={{ marginTop: 4 }}>
      <UserPlus size={16} /> Register a child
    </button>
  );

  if (view === "children")
    return <div><div className="eyebrow" style={{ marginBottom: 12 }}>My children</div>{list}{addBtn}</div>;

  return (
    <>
      <div className="card pad" style={{ marginBottom: 18, background: "linear-gradient(135deg,#17223B,#2B3D62)", color: "#fff", border: "none" }}>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Welcome</div>
        <h2 style={{ fontSize: 26, marginTop: 4 }}>Your family portal</h2>
        <p style={{ color: "#C6CEDC", marginTop: 6 }}>
          {players.length ? `${players.length} child${players.length > 1 ? "ren" : ""} in the pride.` : pending.length ? "Your registration is under review." : "Register your first child to get started."}
        </p>
      </div>
      <div className="eyebrow" style={{ marginBottom: 12 }}>My children</div>
      {list}
      {addBtn}
    </>
  );
}

function RegistrationWizard({ parentName, onCancel, onDone }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [fee, setFee] = useState({ cents: 0, currency: "usd", live: false });

  useEffect(() => {
    supabase.from("club_settings").select("registration_fee_cents,currency,payments_live").eq("id", 1).single()
      .then(({ data }) => data && setFee({ cents: data.registration_fee_cents, currency: data.currency, live: data.payments_live }));
  }, []);

  const set = (patch) => setF({ ...f, ...patch });

  function stepValid(i) {
    if (i === 0) return f.first.trim() && f.last.trim() && f.dob;
    if (i === 1) return !f.hasMedical || (f.allergies.trim() || f.medications.trim() || f.medicalNotes.trim());
    if (i === 2) return f.parentPhone.trim() && f.ecName.trim() && f.ecPhone.trim() && f.ecRelation.trim();
    if (i === 3) return f.acknowledged && f.photoConsent !== null && f.signature.trim().length > 2;
    if (i === 4) return f.payChoice !== null;
    return true;
  }

  function next() {
    if (!stepValid(step)) { setErr(HINTS[step]); return; }
    setErr(null); setStep(Math.min(step + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setErr(null);
    if (step === 0) return onCancel();
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!stepValid(4)) { setErr(HINTS[4]); return; }
    setBusy(true); setErr(null);
    const payStatus = fee.cents === 0 ? "waived" : (f.payChoice === "pay_now" ? "paid" : "pay_later");
    const { error } = await supabase.from("registrations").insert({
      parent_id: user.id,
      child_first_name: f.first.trim(),
      child_last_name: f.last.trim(),
      child_dob: f.dob || null,
      preferred_position: f.position || null,
      has_medical_conditions: f.hasMedical,
      medical_notes: f.medicalNotes.trim() || null,
      allergies: f.allergies.trim() || null,
      medications: f.medications.trim() || null,
      physician_name: f.physicianName.trim() || null,
      physician_phone: f.physicianPhone.trim() || null,
      insurance_provider: f.insurance.trim() || null,
      emergency_contact_name: f.ecName.trim(),
      emergency_contact_phone: f.ecPhone.trim(),
      emergency_contact_relation: f.ecRelation.trim(),
      second_contact_name: f.ec2Name.trim() || null,
      second_contact_phone: f.ec2Phone.trim() || null,
      parent_phone: f.parentPhone.trim(),
      waiver_accepted: f.acknowledged,
      conduct_accepted: f.acknowledged,
      medical_treatment_consent: f.acknowledged,
      photo_consent: f.photoConsent === true,
      waiver_signed_name: f.signature.trim(),
      waiver_signed_at: new Date().toISOString(),
      waiver_version: WAIVER_VERSION,
      fee_amount_cents: fee.cents,
      payment_status: payStatus,
      payment_method: fee.cents === 0 ? null : (f.payChoice === "pay_now" ? "placeholder" : "pay_later"),
      paid_at: payStatus === "paid" ? new Date().toISOString() : null,
    });
    setBusy(false);
    if (error) {
      const missingColumn = /column .* does not exist|schema cache/i.test(error.message);
      return setErr(missingColumn
        ? "The club database hasn't been updated for the new registration form yet. Ask your club admin to run the latest migration in Supabase, then try again."
        : error.message);
    }
    onDone();
  }

  return (
    <div>
      <button className="backlink" onClick={back}><ArrowLeft size={15} /> {step === 0 ? "Back to my children" : STEPS[step - 1][0]}</button>

      <div className="steps">
        {STEPS.map(([label], i) => (
          <Fragment key={label}>
            {i > 0 && <div className={"step-bar" + (i <= step ? " done" : "")} />}
            <div className={"step" + (i === step ? " on" : i < step ? " done" : "")}>
              <div className="dot">{i < step ? "✓" : i + 1}</div>
              <div className="lbl">{label}</div>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="card pad">
        {step === 0 && <StepChild f={f} set={set} />}
        {step === 1 && <StepMedical f={f} set={set} />}
        {step === 2 && <StepContacts f={f} set={set} />}
        {step === 3 && <StepAgreements f={f} set={set} parentName={parentName} />}
        {step === 4 && <StepPayment f={f} set={set} fee={fee} />}

        {err && (
          <div className="notice" style={{ borderLeftColor: "var(--clay)", fontSize: 13, marginTop: 14 }}>
            <ShieldAlert size={16} style={{ flex: "none", color: "var(--clay)" }} /> <span>{err}</span>
          </div>
        )}

        <div className="formnav">
          <button className="btn ghost" onClick={back} disabled={busy}>
            <ArrowLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn primary" onClick={next}>Continue <ArrowRight size={15} /></button>
          ) : (
            <button className="btn primary" onClick={submit} disabled={busy}>
              <UserPlus size={16} /> {busy ? "Submitting…" : "Submit registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const HINTS = [
  "Add your child's first name, last name and date of birth to continue.",
  "You marked a medical condition — please describe it so coaches know what to watch for.",
  "Your phone number and an emergency contact name, number and relationship are required.",
  "Choose a photo option, tick the agreement box, and type your full name to sign.",
  "Choose how you'd like to handle the registration fee to finish.",
];

function StepChild({ f, set }) {
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Step 1 of 5</div>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Who are we registering?</h2>
      <div className="two">
        <div className="field"><label>First name</label>
          <input className="input" value={f.first} onChange={(e) => set({ first: e.target.value })} required /></div>
        <div className="field"><label>Last name</label>
          <input className="input" value={f.last} onChange={(e) => set({ last: e.target.value })} required /></div>
      </div>
      <div className="two">
        <div className="field"><label>Date of birth</label>
          <input className="input" type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} required /></div>
        <div className="field"><label>Preferred position <span className="muted" style={{ textTransform: "none", fontWeight: 500 }}>· optional</span></label>
          <select className="input" value={f.position} onChange={(e) => set({ position: e.target.value })}>
            <option value="">No preference</option>
            {["Goalkeeper", "Defender", "Midfielder", "Forward"].map((p) => <option key={p}>{p}</option>)}
          </select></div>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Date of birth decides which age group your child plays in.</p>
    </>
  );
}

function StepMedical({ f, set }) {
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Step 2 of 5</div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Medical information</h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        Coaches see this on the sideline. Tell us anything that would matter if your child felt unwell or got hurt.
      </p>
      <div className={"agree" + (f.hasMedical ? " on" : "")} style={{ marginBottom: 18 }}>
        <label className="agree-head">
          <input type="checkbox" checked={f.hasMedical} onChange={(e) => set({ hasMedical: e.target.checked })} />
          <div>
            <h4>My child has a medical condition, allergy, or takes medication</h4>
            <p>Asthma, diabetes, epilepsy, severe allergies, anything a coach should know.</p>
          </div>
        </label>
      </div>
      {f.hasMedical && (
        <>
          <div className="field"><label>Allergies</label>
            <input className="input" value={f.allergies} onChange={(e) => set({ allergies: e.target.value })} placeholder="e.g. peanuts, bee stings — and the reaction" /></div>
          <div className="field"><label>Medication</label>
            <input className="input" value={f.medications} onChange={(e) => set({ medications: e.target.value })} placeholder="e.g. carries a blue inhaler in their bag" /></div>
          <div className="field"><label>Anything else a coach should know</label>
            <textarea className="input" rows={3} value={f.medicalNotes} onChange={(e) => set({ medicalNotes: e.target.value })}
              placeholder="e.g. asthma — needs a break and their inhaler if breathing gets tight" /></div>
        </>
      )}
      <div className="two">
        <div className="field"><label>Doctor's name <span className="muted" style={{ textTransform: "none", fontWeight: 500 }}>· optional</span></label>
          <input className="input" value={f.physicianName} onChange={(e) => set({ physicianName: e.target.value })} /></div>
        <div className="field"><label>Doctor's phone <span className="muted" style={{ textTransform: "none", fontWeight: 500 }}>· optional</span></label>
          <input className="input" type="tel" value={f.physicianPhone} onChange={(e) => set({ physicianPhone: e.target.value })} /></div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}><label>Health insurance <span className="muted" style={{ textTransform: "none", fontWeight: 500 }}>· optional</span></label>
        <input className="input" value={f.insurance} onChange={(e) => set({ insurance: e.target.value })} placeholder="Provider name" /></div>
    </>
  );
}

function StepContacts({ f, set }) {
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Step 3 of 5</div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Emergency contacts</h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        Your number, and who we call if your child is hurt and you can't be reached.
      </p>
      <div className="field"><label>Your phone number</label>
        <input className="input" type="tel" value={f.parentPhone} onChange={(e) => set({ parentPhone: e.target.value })} required placeholder="(555) 123-4567" /></div>
      <div className="sect">
        <h5>Emergency contact</h5>
      </div>
      <div className="field"><label>Contact name</label>
        <input className="input" value={f.ecName} onChange={(e) => set({ ecName: e.target.value })} required /></div>
      <div className="two">
        <div className="field"><label>Phone number</label>
          <input className="input" type="tel" value={f.ecPhone} onChange={(e) => set({ ecPhone: e.target.value })} required placeholder="(555) 123-4567" /></div>
        <div className="field"><label>Relationship to child</label>
          <input className="input" value={f.ecRelation} onChange={(e) => set({ ecRelation: e.target.value })} required placeholder="Mother, uncle, neighbour…" /></div>
      </div>
      <div className="sect">
        <h5>Second contact · optional</h5>
        <div className="two">
          <div className="field"><label>Name</label>
            <input className="input" value={f.ec2Name} onChange={(e) => set({ ec2Name: e.target.value })} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Phone number</label>
            <input className="input" type="tel" value={f.ec2Phone} onChange={(e) => set({ ec2Phone: e.target.value })} /></div>
        </div>
      </div>
    </>
  );
}

function StepAgreements({ f, set, parentName }) {
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Step 4 of 5</div>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>{WAIVER_TITLE}</h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        {CLUB_NAME} · Please read the full agreement, choose your photo option, then sign.
      </p>
      <div className="doc">
        {WAIVER_SECTIONS.map((sec) => (
          <section key={sec.n} className="doc-sec">
            <h4><span className="doc-n">{sec.n}</span>{sec.title}</h4>
            <p>{sec.body}</p>
          </section>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: "8px 0 20px" }}>Scroll inside the box to read the whole agreement.</p>
      <div className="sect">
        <h5>7 · Photography &amp; video — choose one</h5>
        {PHOTO_CHOICES.map((c) => (
          <label key={String(c.value)} className={"agree" + (f.photoConsent === c.value ? " on" : "")} style={{ display: "block", cursor: "pointer" }}>
            <div className="agree-head" style={{ cursor: "pointer" }}>
              <input type="radio" name="photoConsent" checked={f.photoConsent === c.value} onChange={() => set({ photoConsent: c.value })} style={{ borderRadius: "50%" }} />
              <div><p style={{ color: "var(--ink)", fontWeight: 600 }}>{c.label}</p></div>
            </div>
          </label>
        ))}
      </div>
      <div className="sect">
        <h5>9 · Acknowledgment</h5>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 12, lineHeight: 1.55 }}>{ACKNOWLEDGEMENT_INTRO}</p>
        <label className={"agree" + (f.acknowledged ? " on" : "")} style={{ display: "block", cursor: "pointer" }}>
          <div className="agree-head" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={f.acknowledged} onChange={(e) => set({ acknowledged: e.target.checked })} />
            <div><p style={{ color: "var(--ink)", fontWeight: 700 }}>{ACKNOWLEDGEMENT}</p></div>
          </div>
        </label>
      </div>
      <div className="sect">
        <h5>Parent/guardian electronic signature</h5>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Type your full name</label>
          <input className="input" value={f.signature} onChange={(e) => set({ signature: e.target.value })}
            placeholder={parentName || "Your full name"} style={{ fontFamily: "var(--disp)", fontSize: 19 }} />
        </div>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          Typing your name signs this agreement electronically. We record your name, today's date, and the
          version of the agreement you signed ({WAIVER_VERSION}).
        </p>
      </div>
    </>
  );
}

function money(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function StepPayment({ f, set, fee }) {
  const free = fee.cents === 0;
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Step 5 of 5</div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Registration fee</h2>
      {free ? (
        <>
          <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>There's no fee to register right now. Tap below to finish.</p>
          <label className={"agree" + (f.payChoice === "pay_later" ? " on" : "")} style={{ display: "block", cursor: "pointer" }}>
            <div className="agree-head" style={{ cursor: "pointer" }}>
              <input type="radio" name="pay" checked={f.payChoice === "pay_later"} onChange={() => set({ payChoice: "pay_later" })} style={{ borderRadius: "50%" }} />
              <div><h4>No fee — complete registration</h4><p>Your child's spot is confirmed once an admin approves.</p></div>
            </div>
          </label>
        </>
      ) : (
        <>
          <div className="fee-box"><span>Registration fee</span><b>{money(fee.cents, fee.currency)}</b></div>
          <p className="muted" style={{ fontSize: 13.5, margin: "12px 0 16px", lineHeight: 1.55 }}>
            Choose how you'd like to handle the fee. Online card payment is being set up —
            for now you can reserve the spot and pay the club directly.
          </p>
          <label className={"agree" + (f.payChoice === "pay_now" ? " on" : "")} style={{ display: "block", cursor: "pointer" }}>
            <div className="agree-head" style={{ cursor: "pointer" }}>
              <input type="radio" name="pay" checked={f.payChoice === "pay_now"} onChange={() => set({ payChoice: "pay_now" })} style={{ borderRadius: "50%" }} />
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: 7 }}><CreditCard size={16} /> I'll pay online now</h4>
                <p>Card payment is coming soon — for now this marks your intent to pay online and an admin will confirm.</p>
              </div>
            </div>
          </label>
          <label className={"agree" + (f.payChoice === "pay_later" ? " on" : "")} style={{ display: "block", cursor: "pointer" }}>
            <div className="agree-head" style={{ cursor: "pointer" }}>
              <input type="radio" name="pay" checked={f.payChoice === "pay_later"} onChange={() => set({ payChoice: "pay_later" })} style={{ borderRadius: "50%" }} />
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: 7 }}><Wallet size={16} /> I'll pay the club directly</h4>
                <p>Reserve the spot now and pay in person (cash or other) at the first practice.</p>
              </div>
            </div>
          </label>
          <div className="warn" style={{ marginTop: 8 }}>
            <span>Either way, no money is charged in the app yet. Your registration is submitted for admin approval.</span>
          </div>
        </>
      )}
    </>
  );
}
