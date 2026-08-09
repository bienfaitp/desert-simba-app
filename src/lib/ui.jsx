import logo from "../assets/logo.webp";
import { Inbox } from "lucide-react";

export function Logo({ h = 44 }) {
  return <img src={logo} alt="Desert Simba Academy" style={{ height: h, width: "auto", display: "block" }} />;
}

export function Empty({ icon: Icon = Inbox, title, body, cta, onCta }) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon size={26} /></div>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      {cta && <button className="btn primary sm" onClick={onCta}>{cta}</button>}
    </div>
  );
}

export const initials = (a, b) => `${(a || "?")[0] || ""}${(b || "")[0] || ""}`.toUpperCase();
