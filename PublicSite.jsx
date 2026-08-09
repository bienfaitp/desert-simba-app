import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Logo } from "../lib/ui";
import { SITE, INSIDE_CARDS, VALUES, PUBLIC_NAV } from "../lib/site";
import AuthModal from "./AuthModal";
import {
  Menu, X, LogIn, ArrowRight, Lock, Mail, MapPin, Phone,
} from "lucide-react";

export default function PublicSite() {
  const [page, setPage] = useState("home");
  const [menu, setMenu] = useState(false);
  const [auth, setAuth] = useState(null); // null | "signin" | "signup"

  const go = (p) => { setPage(p); setMenu(false); window.scrollTo({ top: 0 }); };
  const openAuth = (mode = "signin") => { setMenu(false); setAuth(mode); };

  return (
    <div className="site">
      <SiteHeader page={page} go={go} menu={menu} setMenu={setMenu} openAuth={openAuth} />

      {page === "home" && <Home openAuth={openAuth} />}
      {page === "about" && <About openAuth={openAuth} />}
      {page === "contact" && <Contact />}

      <SiteFooter go={go} openAuth={openAuth} />

      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} />}
    </div>
  );
}

/* ── header ───────────────────────────────────────────────────────────── */
function SiteHeader({ page, go, menu, setMenu, openAuth }) {
  return (
    <header className="site-head">
      <button className="site-brand" onClick={() => go("home")} aria-label="Home"><Logo h={38} /></button>
      <nav className="site-nav">
        {PUBLIC_NAV.map(([k, l]) => (
          <button key={k} className={"site-navlink" + (page === k ? " on" : "")} onClick={() => go(k)}>{l}</button>
        ))}
        <button className="btn gold sm" onClick={() => openAuth("signin")}><LogIn size={15} /> Login</button>
      </nav>
      <button className="site-burger" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={22} /></button>

      {menu && (
        <div className="site-drawer-wrap" onClick={() => setMenu(false)}>
          <div className="site-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="site-drawer-top">
              <Logo h={34} />
              <button onClick={() => setMenu(false)} aria-label="Close menu" style={{ color: "#fff" }}><X size={22} /></button>
            </div>
            {PUBLIC_NAV.map(([k, l]) => (
              <button key={k} className={"site-drawer-link" + (page === k ? " on" : "")} onClick={() => go(k)}>{l}</button>
            ))}
            <button className="btn gold block" style={{ marginTop: 14 }} onClick={() => openAuth("signin")}><LogIn size={16} /> Login</button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── home ─────────────────────────────────────────────────────────────── */
function Home({ openAuth }) {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge"><Logo h={120} /></div>
          <div className="hero-eyebrow">{SITE.heroLead} · {SITE.ageRange}</div>
          <h1 className="hero-title">
            {SITE.heroTitle[0]} <span className="accent">{SITE.heroTitle[1]}</span> {SITE.heroTitle[2]}
          </h1>
          <div className="hero-strip">{SITE.tagline}</div>
          <p className="hero-body">{SITE.heroBody}</p>
          <div className="hero-cta">
            <button className="btn gold" onClick={() => openAuth("signup")}>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>Create your account <ArrowRight size={16} /></span>
            </button>
            <button className="btn night-ghost" onClick={() => openAuth("signin")}><LogIn size={16} /> Log in</button>
          </div>
          <p className="hero-note"><Lock size={12} /> Registration, waivers and payment all happen securely inside your account.</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="eyebrow" style={{ textAlign: "center", justifyContent: "center", display: "flex" }}>Inside the app</div>
          <h2 className="band-title" style={{ textAlign: "center" }}>Everything for your family, once you're in</h2>
          <div className="inside-grid">
            {INSIDE_CARDS.map((c) => (
              <button key={c.key} className="inside-card" onClick={() => openAuth("signup")}>
                <div className="entry-ic" style={{ background: c.tint + "1f", color: c.tint }}><c.icon size={22} /></div>
                <div className="entry-title">{c.title}</div>
                <div className="entry-body">{c.body}</div>
                <div className="inside-lock"><Lock size={12} /> Sign in to open</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <div className="eyebrow">Why families choose us</div>
          <h2 className="band-title">One club, in sync</h2>
          <div className="value-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="value">
                <div className="value-ic"><v.icon size={20} /></div>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-inner">
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ fontSize: 26, color: "#fff" }}>Join the pride</h2>
            <p style={{ color: "#ffe9dc", marginTop: 6 }}>Create an account to register your child, sign the waiver, and handle the fee — all in one place.</p>
          </div>
          <button className="btn primary" onClick={() => openAuth("signup")}>Get started <ArrowRight size={16} /></button>
        </div>
      </section>
    </>
  );
}

/* ── about ────────────────────────────────────────────────────────────── */
function About({ openAuth }) {
  return (
    <section className="band" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ maxWidth: 680 }}>
        <div className="eyebrow">About</div>
        <h2 className="band-title">{SITE.tagline}</h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink)", marginBottom: 16 }}>
          Desert Simba Academy is a community youth soccer club for players aged 6–14. We're
          about more than results — we help young players build confidence, teamwork and a love
          of the game, in a place where parents, coaches and organisers all stay on the same page.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--muted)", marginBottom: 22 }}>
          Everything a family needs — enrollment, the medical form and waiver, team news and your
          player's progress — lives inside one simple account.
        </p>
        <div className="value-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="value">
              <div className="value-ic"><v.icon size={20} /></div>
              <h3>{v.title}</h3><p>{v.body}</p>
            </div>
          ))}
        </div>
        <div className="soon-card" style={{ marginTop: 26, textAlign: "center" }}>
          <h3 style={{ fontSize: 20, marginBottom: 6, color: "#fff" }}>Ready to join?</h3>
          <p style={{ color: "#C6CEDC", marginBottom: 14 }}>Create your account to get started.</p>
          <button className="btn gold" onClick={() => openAuth("signup")}>Create your account</button>
        </div>
      </div>
    </section>
  );
}

/* ── contact ──────────────────────────────────────────────────────────── */
function Contact() {
  return (
    <section className="band" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="eyebrow">Clubhouse</div>
        <h2 className="band-title">Get in touch</h2>
        <div className="card pad" style={{ marginTop: 8 }}>
          <div className="contact-row"><MapPin size={18} /> <span>{SITE.address || "Address coming soon"}</span></div>
          <div className="contact-row"><Phone size={18} /> <span>{SITE.phone || "Phone coming soon"}</span></div>
          <div className="contact-row"><Mail size={18} /> <a href={`mailto:${SITE.email}`} style={{ color: "var(--sunset)", fontWeight: 700 }}>{SITE.email}</a></div>
        </div>
      </div>
    </section>
  );
}

/* ── footer ───────────────────────────────────────────────────────────── */
function SiteFooter({ go, openAuth }) {
  return (
    <footer className="site-foot">
      <div className="wrap" style={{ display: "grid", placeItems: "center", gap: 14, textAlign: "center" }}>
        <Logo h={64} />
        <div className="foot-nav">
          {PUBLIC_NAV.map(([k, l]) => <button key={k} onClick={() => go(k)}>{l}</button>)}
          <button onClick={() => openAuth("signin")}>Login</button>
        </div>
        <p className="foot-legal">{SITE.tagline} · © {SITE.year} Desert Simba Academy</p>
      </div>
    </footer>
  );
}
