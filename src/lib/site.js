// Editable content for the public-facing website. Change club details, the
// value props, or the nav here without touching any layout code.
import {
  UserPlus, HeartPulse, FileSignature, LineChart, Users2, BellRing, ClipboardCheck,
} from "lucide-react";

export const SITE = {
  tagline: "Play · Learn · Grow · Together",
  ageRange: "Ages 6–14",
  heroLead: "Youth soccer",
  heroTitle: ["Where young", "lions", "learn to lead."], // middle word is accented
  heroBody:
    "A home for the desert's next generation of footballers — one place that keeps parents, coaches, and admins in sync.",
  email: "hello@desertsimba.club",
  phone: "",       // fill in when you have one
  address: "",     // fill in when you have one
  year: new Date().getFullYear(),
};

// "What's inside" — teasers shown to logged-out visitors. Every one prompts
// sign-in, because all real actions live inside the app after login.
export const INSIDE_CARDS = [
  { key: "register", icon: UserPlus, tint: "#E1571E", title: "Register your child", body: "Enrollment, all in one place" },
  { key: "waiver", icon: FileSignature, tint: "#E9A62C", title: "Sign the waiver", body: "Medical form & agreement, done online" },
  { key: "track", icon: LineChart, tint: "#167D6B", title: "Follow your player", body: "Attendance, goals and coach notes" },
  { key: "health", icon: HeartPulse, tint: "#2B3D62", title: "Safety on file", body: "Emergency contacts coaches can reach" },
];

// Why-us value props, shown on the home page.
export const VALUES = [
  { icon: Users2, title: "One club, in sync", body: "Parents, coaches and admins share the same up-to-date information — no group-chat chaos." },
  { icon: ClipboardCheck, title: "Registration that's real", body: "Medical details, emergency contacts and a signed waiver captured before a child steps on the field." },
  { icon: LineChart, title: "Track every player", body: "Attendance, goals and coach feedback in one place, visible to the family it belongs to." },
  { icon: BellRing, title: "Never miss a match", body: "Schedules and announcements land where families already look." },
];

// Nav shown in the public header.
export const PUBLIC_NAV = [
  ["home", "Home"],
  ["about", "About"],
  ["contact", "Contact"],
];
