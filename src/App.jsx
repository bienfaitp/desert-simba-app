import { useState, useEffect, useRef } from "react";
import { useAuth } from "./lib/AuthProvider";
import AuthModal from "./public/AuthModal";
import PublicSite from "./public/AuthModal";
import Admin from "./pages/Admin";
import Parent from "./pages/Parent";
import Coach from "./pages/Coach";
import {
  LayoutDashboard, Users, ClipboardCheck, LogOut, User, ShieldCheck, Building2,
  UserPlus, Trophy, Menu, X, ChevronDown, Repeat,
} from "lucide-react";

const NAV = {
  admin: [["dash", "Dashboard", LayoutDashboard], ["regs", "Registrations", ClipboardCheck], ["teams", "Teams & players", Users]],
  coach: [["dash", "Dashboard", LayoutDashboard], ["players", "Players", Users], ["attendance", "Attendance", ClipboardCheck], ["matches", "Matches", Trophy]],
  parent: [["dash", "Dashboard", LayoutDashboard], ["children", "My children", UserPlus]],
};
const ROLE_ICON = { admin: Building2, coach: ShieldCheck, parent: User };
const PRIORITY = ["admin", "coach", "parent"];

export default function App() {
  const { session, roles, profile, loading, signOut } = useAuth();
  const available = PRIORITY.filter((r) => roles.includes(r));
  const [role, setRole] = useState(null);
  const [view, setView] = useState("dash");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    const onResize = () => window.innerWidth > 820 && setDrawer(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, []);

  if (loading) return <div className="center">Loading your club…</div>;
  if (!session) return <AuthModal mode="signin" onClose={() => {}} />; 
  if (available.length === 0)
    return (
      <div className="center">
        <div style={{ maxWidth: 380 }}>
          <p style={{ marginBottom: 16 }}>Your account has no role yet. Ask an admin to grant you access.</p>
          <button className="btn ghost sm" onClick={signOut}><LogOut size={14} /> Sign out</button>
        </div>
      </div>
    );

  const active = role && available.includes(role) ? role : available[0];
  const items = NAV[active];
  const title = (items.find((i) => i[0] === view) || items[0])[1];
  const RoleIcon = ROLE_ICON[active];
  const go = (v) => { setView(v); setDrawer(false); };
  const switchRole = (r) => { setRole(r); setView("dash"); setDrawer(false); };

  const navList = (
    <>
      <div className="role-tag"><RoleIcon size={14} /> {active}</div>
      {items.map(([k, l, Icon]) => (
        <button key={k} className={"navitem" + (view === k ? " on" : "")} onClick={() => go(k)}>
          <Icon size={18} /> {l}
        </button>
      ))}
      <div className="spacer" />
      <div className="switch">
        {available.length > 1 && (<>
          <small>Switch role</small>
          {available.filter((r) => r !== active).map((r) => (
            <button key={r} className="navitem" onClick={() => switchRole(r)} style={{ textTransform: "capitalize" }}>
              <Repeat size={18} /> {r}
            </button>
          ))}
        </>)}
        <button className="navitem" onClick={signOut}><LogOut size={18} /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className="shell">
      <aside className="side">
        <div style={{ padding: "8px 8px 14px" }}><Logo h={40} /></div>
        {navList}
      </aside>

      {drawer && (
        <>
          <div className="backdrop" onClick={() => setDrawer(false)} />
          <nav className="drawer" aria-label="Main navigation">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 14px" }}>
              <Logo h={36} />
              <button className="navitem" onClick={() => setDrawer(false)} aria-label="Close menu" style={{ width: "auto", padding: 8 }}><X size={20} /></button>
            </div>
            {navList}
          </nav>
        </>
      )}

      <main className="main">
        <div className="main-head">
          <button className="iconbtn" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <h1>{title}</h1>
          <div style={{ marginLeft: "auto" }}>
            <AccountMenu profile={profile} email={session.user.email} role={active} onSignOut={signOut} />
          </div>
        </div>
        <div className="main-body">
          {active === "admin" && <Admin view={view} go={go} />}
          {active === "coach" && <Coach view={view} go={go} />}
          {active === "parent" && <Parent view={view} go={go} />}
        </div>
      </main>
    </div>
  );
}

function AccountMenu({ profile, email, role, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const name = profile?.full_name || email;
  const letter = (name || "?")[0].toUpperCase();

  return (
    <div className="acct" ref={ref}>
      <button className="acct-btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <span className="acct-name">{name}</span>
        <div className="avatar" style={{ width: 32, height: 32, background: "var(--night3)", fontSize: 12 }}>{letter}</div>
        <ChevronDown size={14} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="who">
            <b>{profile?.full_name || "Your account"}</b>
            <span>{email}</span>
            <span style={{ textTransform: "capitalize", color: "var(--sunset)", fontWeight: 700 }}>{role}</span>
          </div>
          <button className="menuitem danger" role="menuitem" onClick={onSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
