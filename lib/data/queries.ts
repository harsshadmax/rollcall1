import "server-only";
import { createClient } from "@/lib/supabase/server";
import { attendancePct, projectAttendance } from "@/lib/domain/attendance";
import type { Subject, SubjectStanding, DayRow, SessionStatus } from "./types";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getProfile() {
  const { supabase, user } = await ctx();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("display_name, threshold_theory, threshold_practical")
    .eq("id", user.id)
    .single();
  return data;
}

export async function getActiveSemesterId(): Promise<string | null> {
  const { supabase, user } = await ctx();
  if (!user) return null;
  const { data } = await supabase
    .from("semesters")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ?? null;
}

export async function listSubjects(): Promise<Subject[]> {
  const semesterId = await getActiveSemesterId();
  if (!semesterId) return [];
  const { supabase } = await ctx();
  const { data } = await supabase
    .from("subjects")
    .select("id, code, name, credits, kind, color_token, instructor, room, threshold_override")
    .eq("semester_id", semesterId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Subject[];
}

function thresholdFor(
  s: Subject,
  profile: { threshold_theory: number; threshold_practical: number },
): number {
  if (s.threshold_override != null) return Number(s.threshold_override);
  return s.kind === "lab" ? Number(profile.threshold_practical) : Number(profile.threshold_theory);
}

/** Per-subject standing (%, can-skip/must-attend) computed from all class_sessions. */
export async function getStandings(): Promise<{
  subjects: SubjectStanding[];
  overall: { present: number; held: number; pct: number | null };
}> {
  const [subjects, profile] = await Promise.all([listSubjects(), getProfile()]);
  if (subjects.length === 0 || !profile) {
    return { subjects: [], overall: { present: 0, held: 0, pct: null } };
  }
  const { supabase } = await ctx();
  const ids = subjects.map((s) => s.id);
  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("subject_id, status")
    .in("subject_id", ids);

  const tally = new Map<string, { present: number; absent: number }>();
  for (const s of subjects) tally.set(s.id, { present: 0, absent: 0 });
  for (const row of sessions ?? []) {
    const t = tally.get(row.subject_id);
    if (!t) continue;
    if (row.status === "present") t.present++;
    else if (row.status === "absent") t.absent++;
  }

  let oPresent = 0;
  let oHeld = 0;
  const standings: SubjectStanding[] = subjects.map((s) => {
    const { present, absent } = tally.get(s.id)!;
    const held = present + absent;
    const threshold = thresholdFor(s, profile);
    const proj = projectAttendance(present, held, threshold);
    oPresent += present;
    oHeld += held;
    return {
      ...s,
      present,
      absent,
      held,
      pct: attendancePct({ present, absent }),
      threshold,
      canSkip: proj.canSkip,
      mustAttend: proj.mustAttend,
      unrecoverable: proj.unrecoverable,
    };
  });

  return {
    subjects: standings,
    overall: { present: oPresent, held: oHeld, pct: attendancePct({ present: oPresent, absent: oHeld - oPresent }) },
  };
}

/** The marking rows for one date: every subject + its status that day. */
export async function getDay(iso: string): Promise<DayRow[]> {
  const subjects = await listSubjects();
  if (subjects.length === 0) return [];
  const { supabase } = await ctx();
  const ids = subjects.map((s) => s.id);
  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("subject_id, status")
    .eq("day", iso)
    .in("subject_id", ids);
  const byId = new Map<string, SessionStatus>();
  for (const row of sessions ?? []) byId.set(row.subject_id, row.status as SessionStatus);
  return subjects.map((s) => ({ subject: s, status: byId.get(s.id) ?? "unmarked" }));
}
