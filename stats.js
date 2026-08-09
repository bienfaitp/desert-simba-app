// Derive player/team stats from raw rows loaded out of Supabase.

export function attendanceFor(attRows, playerId) {
  const mine = attRows.filter((a) => a.player_id === playerId);
  const total = mine.length;
  const present = mine.filter((a) => a.status === "present" || a.status === "late").length;
  return { total, present, pct: total ? Math.round((present / total) * 100) : null };
}

export function goalsFor(statRows, playerId) {
  let goals = 0, assists = 0;
  statRows.forEach((s) => { if (s.player_id === playerId) { goals += s.goals || 0; assists += s.assists || 0; } });
  return { goals, assists };
}

export const wdl = (m) => (m.our_score > m.opp_score ? "W" : m.our_score === m.opp_score ? "D" : "L");

export function standingsFrom(matches, teams) {
  return teams.map((t) => {
    const ms = matches.filter((m) => m.team_id === t.id);
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    ms.forEach((m) => { gf += m.our_score; ga += m.opp_score; if (m.our_score > m.opp_score) w++; else if (m.our_score === m.opp_score) d++; else l++; });
    return { team: t, p: ms.length, w, d, l, gf, ga, pts: w * 3 + d };
  }).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}
