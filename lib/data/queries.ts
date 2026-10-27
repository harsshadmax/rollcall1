import "server-only";
import { createClient } from "@/lib/supabase/server";
import { attendancePct, projectAttendance } from "@/lib/domain/attendance";
import type { Subject, SubjectStanding, SessionStatus, Period, ScheduleRow, SlotRow } from "./types";

/** ISO date -> weekday 1 (Mon) .. 7 (Sun). */
export function isoWeekday(iso: string): number {
  const d = new Date(iso + "T00:00:00").getDay(); // 0 Sun .. 6 Sat
  return d === 0 ? 7 : d;
}

const SUBJECT_COLS = "id, code, name, credits, kind, color_token, instructor, room, threshold_override";

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

export interface DayCell {
  present: number;
  absent: number;
  cancelled: number;
}
export interface MonthAttendance {
  year: number;
  month: number; // 1-12
  lastDay: number;
  firstWeekday: number; // 0 = Monday .. 6 = Sunday
  byDay: Record<number, DayCell>;
  present: number;
  held: number;
  pct: number | null;
  presentDays: number;
  absentDays: number;
}

/** Per-day attendance for a month ("YYYY-MM") for the emoji calendar. */
export async function getMonthAttendance(ym: string): Promise<MonthAttendance> {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const first = `${ym}-01`;
  const last = `${ym}-${String(lastDay).padStart(2, "0")}`;
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday-start

  const { supabase, user } = await ctx();
  const byDay: Record<number, DayCell> = {};
  let present = 0;
  let held = 0;
  let presentDays = 0;
  let absentDays = 0;

  if (user) {
    const { data } = await supabase
      .from("class_sessions")
      .select("day, status")
      .gte("day", first)
      .lte("day", last);
    for (const r of data ?? []) {
      const d = Number((r.day as string).slice(8, 10));
      const cell = byDay[d] ?? { present: 0, absent: 0, cancelled: 0 };
      if (r.status === "present") cell.present++;
      else if (r.status === "absent") cell.absent++;
      else if (r.status === "cancelled") cell.cancelled++;
      byDay[d] = cell;
    }
    for (const cell of Object.values(byDay)) {
      present += cell.present;
      held += cell.present + cell.absent;
      if (cell.absent > 0) absentDays++;
      else if (cell.present > 0) presentDays++;
    }
  }

  return {
    year: y,
    month: m,
    lastDay,
    firstWeekday,
    byDay,
    present,
    held,
    pct: attendancePct({ present, absent: held - present }),
    presentDays,
    absentDays,
  };
}

export async function getPeriods(): Promise<Period[]> {
  const semesterId = await getActiveSemesterId();
  if (!semesterId) return [];
  const { supabase } = await ctx();
  const { data } = await supabase
    .from("periods")
    .select("id, idx, starts_at, ends_at")
    .eq("semester_id", semesterId)
    .order("idx", { ascending: true });
  return (data ?? []) as Period[];
}

/** All timetable slots for the active semester (for the weekly grid editor). */
export async function getTimetable(): Promise<SlotRow[]> {
  const semesterId = await getActiveSemesterId();
  if (!semesterId) return [];
  const { supabase } = await ctx();
  const { data } = await supabase
    .from("timetable_slots")
    .select(`slotId:id, weekday, period:periods(id, idx, starts_at, ends_at), subject:subjects(${SUBJECT_COLS})`)
    .eq("semester_id", semesterId)
    .order("weekday", { ascending: true });
  const rows = (data ?? []) as unknown as SlotRow[];
  return rows.sort((a, b) => a.weekday - b.weekday || a.period.idx - b.period.idx);
}

function fmt(t: string | null): string | null {
  return t ? t.slice(0, 5) : null;
}

/** The classes to mark on a date: the day's timetable, or every subject if no timetable exists yet. */
export async function getDaySchedule(iso: string): Promise<{ rows: ScheduleRow[]; hasTimetable: boolean }> {
  const subjects = await listSubjects();
  if (subjects.length === 0) return { rows: [], hasTimetable: false };
  const { supabase } = await ctx();
  const semesterId = await getActiveSemesterId();

  const { count: slotCount } = await supabase
    .from("timetable_slots")
    .select("id", { count: "exact", head: true })
    .eq("semester_id", semesterId);
  const hasTimetable = (slotCount ?? 0) > 0;

  if (!hasTimetable) {
    // fallback: every subject, no period, keyed by (subject, day)
    const { data: sessions } = await supabase.from("class_sessions").select("subject_id, status").eq("day", iso);
    const byId = new Map<string, SessionStatus>();
    for (const r of sessions ?? []) byId.set(r.subject_id, r.status as SessionStatus);
    return {
      hasTimetable,
      rows: subjects.map((s) => ({ slotId: null, periodId: null, time: null, subject: s, status: byId.get(s.id) ?? "unmarked" })),
    };
  }

  const weekday = isoWeekday(iso);
  const { data: slots } = await supabase
    .from("timetable_slots")
    .select(`id, period:periods(id, idx, starts_at, ends_at), subject:subjects(${SUBJECT_COLS})`)
    .eq("semester_id", semesterId)
    .eq("weekday", weekday);

  const { data: sessions } = await supabase.from("class_sessions").select("period_id, subject_id, status").eq("day", iso);
  const statusByKey = new Map<string, SessionStatus>();
  for (const r of sessions ?? []) statusByKey.set(`${r.subject_id}:${r.period_id ?? ""}`, r.status as SessionStatus);

  type RawSlot = { id: string; period: Period; subject: Subject };
  const rows: ScheduleRow[] = ((slots ?? []) as unknown as RawSlot[])
    .sort((a, b) => a.period.idx - b.period.idx)
    .map((s) => ({
      slotId: s.id,
      periodId: s.period.id,
      time: `${fmt(s.period.starts_at)}–${fmt(s.period.ends_at)}`,
      subject: s.subject,
      status: statusByKey.get(`${s.subject.id}:${s.period.id}`) ?? "unmarked",
    }));
  return { rows, hasTimetable };
}
