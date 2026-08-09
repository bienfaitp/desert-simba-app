// ─────────────────────────────────────────────────────────────────────────────
//  Desert Simba Academy — Youth Sports Liability Waiver & Parent/Guardian
//  Agreement. This is the club's own wording, reproduced as written.
//
//  If you change any wording, bump WAIVER_VERSION below. Every registration
//  stores the version the family agreed to, so you always know exactly which
//  text each person signed.
// ─────────────────────────────────────────────────────────────────────────────

export const CLUB_NAME = "Desert Simba Academy";
export const WAIVER_VERSION = "2026-08-v1";
export const WAIVER_TITLE = "Youth Sports Liability Waiver & Parent/Guardian Agreement";

export const WAIVER_SECTIONS = [
  {
    n: 1,
    title: "Participation",
    body: `I give permission for my child to participate in Desert Simba Academy soccer practices, games, training sessions, camps, activities, and related youth sports events.

I understand that participation in soccer involves physical activity and inherent risks, including falls, collisions, contact with other players, athletic injuries, weather-related conditions, and other risks associated with organized sports.`,
  },
  {
    n: 2,
    title: "Assumption of Risk",
    body: `I understand and voluntarily accept the ordinary risks associated with my child participating in Desert Simba Academy activities.

I agree that my child will follow the instructions of coaches, staff, referees, and academy organizers and will follow applicable safety rules.`,
  },
  {
    n: 3,
    title: "Release and Waiver",
    body: `To the extent permitted by applicable law, I agree to release and hold harmless Desert Simba Academy and its owners, coaches, volunteers, staff, organizers, and participating families from claims arising from my child's participation, except to the extent caused by conduct that cannot legally be released or waived.`,
  },
  {
    n: 4,
    title: "Medical Emergency Authorization",
    body: `If my child experiences an injury or medical emergency while participating in an academy activity, I authorize Desert Simba Academy staff or volunteers to seek reasonable emergency medical assistance when I cannot be reached.

I understand that Desert Simba Academy is not responsible for medical expenses incurred on behalf of my child.`,
  },
  {
    n: 5,
    title: "Health & Safety",
    body: `I agree to inform Desert Simba Academy of any condition, restriction, allergy, medication, or other information that may affect my child's safe participation.

I understand that coaches and organizers must be informed of relevant safety information before participation.`,
  },
  {
    n: 6,
    title: "Parent/Guardian Responsibility",
    body: `I understand that I am responsible for ensuring that my child arrives prepared for participation and follows the academy's rules and expectations.

I agree to communicate promptly with Desert Simba Academy regarding injuries, behavioral concerns, schedule changes, or other matters involving my child.`,
  },
  {
    n: 7,
    title: "Photography & Video",
    body: `I understand that photographs and videos may be taken during academy activities.

Your choice is recorded below.`,
  },
  {
    n: 8,
    title: "Code of Conduct",
    body: `I agree that my child and our family will treat players, coaches, referees, volunteers, and other families with respect.

Harassment, bullying, fighting, discrimination, abusive language, or threatening behavior will not be tolerated.`,
  },
];

// Section 7 is an explicit either/or choice, not a box that defaults to "no".
export const PHOTO_CHOICES = [
  {
    value: true,
    label:
      "I give permission for my child's photograph/video to be used for Desert Simba Academy's website, app, social media, promotional materials, and academy communications.",
  },
  {
    value: false,
    label:
      "I do not give permission for my child's photograph/video to be used for promotional purposes.",
  },
];

// Section 9 — the single acknowledgment that covers the whole document.
export const ACKNOWLEDGEMENT =
  "I agree to the Desert Simba Academy Youth Sports Liability Waiver and Parent/Guardian Agreement.";

export const ACKNOWLEDGEMENT_INTRO =
  "By checking the box below, I confirm that I have read and understand this Youth Sports Liability Waiver & Parent/Guardian Agreement.";
