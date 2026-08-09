import { useState } from "react";
import { useAuth } from "./lib/AuthProvider";
import { Logo } from "./lib/ui";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Parent from "./pages/Parent";
import Coach from "./pages/Coach";
import {
  LayoutDashboard, Users, ClipboardCheck, LogIn, User, ShieldCheck, Building2, UserPlus, Trophy,
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

  if (loading) return <div className="center">Loading your club…</div>;
  if (!session) return <Login />;
  if (available.length === 0) return <div className="center">Your account has no role yet. Ask an admin to grant you access.</div>;

  const active = role && available.includes(role) ? role : available[0];
  const items = NAV[active];
  const title = (items.find((i) => i[0] === view) || items[0])[1];
  const RoleIcon = ROLE_ICON[active];
  const go = (v) => setView(v);
  const switchRole = (r) => { setRole(r); setView("dash"); };

  return (
    <div className="shell">
      <aside className="side">
        <div style={{ padding: "8px 8px 14px" }}><Logo h={40} /></div>
        <div className="role-tag"><RoleIcon size={14} /> {active}</div>
        {items.map(([k, l, Icon]) => (
          <button key={k} className={"navitem" + (view === k ? " on" : "")} onClick={() => go(k)}><Icon size={18} /> {l}</button>
        ))}
        <div className="spacer" />
        <div className="switch">
          {available.length > 1 && (<>
            <small>Switch role</small>
            {available.filter((r) => r !== active).map((r) => (
              <button key={r} className="navitem" onClick={() => switchRole(r)} style={{ textTransform: "capitalize" }}>{r}</button>
            ))}
          </>)}
          <button className="navitem" onClick={signOut}><LogIn size={18} /> Sign out</button>
        </div>
      </aside>

      <main className="main">
        <div className="main-head">
          <h1>{title}</h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>{profile?.full_name || session.user.email}</span>
            <div className="avatar" style={{ width: 36, height: 36, background: "var(--night3)", fontSize: 13 }}>
              {(profile?.full_name || session.user.email || "?")[0].toUpperCase()}
            </div>
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
