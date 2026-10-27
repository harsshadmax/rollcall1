import "server-only";
import { createClient } from "@/lib/supabase/server";
import { attendancePct, projectAttendance } from "@/lib/domain/attendance";
import type { Subject, SubjectStanding, SessionStatus, Period, ScheduleRow, SlotRow, UpcomingDay } from "./types";

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

export interface GradeBand {
  grade: string;
  points: number;
  counts_in_gpa: boolean;
}

export async function getGradeScale(): Promise<GradeBand[]> {
  const { supabase, user } = await ctx();
  if (!user) return [];
  const { data: prof } = await supabase.from("profiles").select("grade_scale_id").eq("id", user.id).single();
  const scaleId = prof?.grade_scale_id;
  if (!scaleId) return [];
  const { data } = await supabase
    .from("grade_points")
    .select("grade, points, counts_in_gpa")
    .eq("grade_scale_id", scaleId)
    .order("sort", { ascending: true });
  return (data ?? []) as GradeBand[];
}

export interface MarksData {
  subjects: (Subject & { grade: string | null })[];
  scale: GradeBand[];
  gpa: number | null;
  points: number;
  credits: number;
}

export async function getMarks(): Promise<MarksData> {
  const [subjects, scale] = await Promise.all([listSubjects(), getGradeScale()]);
  if (subjects.length === 0) return { subjects: [], scale, gpa: null, points: 0, credits: 0 };
  const { supabase } = await ctx();
  const { data: results } = await supabase
    .from("subject_results")
    .select("subject_id, grade")
    .eq("attempt", 1)
    .in(
      "subject_id",
      subjects.map((s) => s.id),
    );
  const gradeBySubject = new Map((results ?? []).map((r) => [r.subject_id, r.grade as string]));
  const bandByGrade = new Map(scale.map((b) => [b.grade, b]));

  let points = 0;
  let credits = 0;
  const withGrades = subjects.map((s) => {
    const grade = gradeBySubject.get(s.id) ?? null;
    const band = grade ? bandByGrade.get(grade) : undefined;
    if (band?.counts_in_gpa) {
      points += Number(s.credits) * Number(band.points);
      credits += Number(s.credits);
    }
    return { ...s, grade };
  });

  return { subjects: withGrades, scale, points, credits, gpa: credits ? Math.round((points / credits) * 100) / 100 : null };
}

/** Scheduled classes for the next `days` days (from the weekly timetable), for the what-if planner. */
export async function getUpcoming(days = 14): Promise<UpcomingDay[]> {
  const slots = await getTimetable();
  if (slots.length === 0) return [];
  const byWeekday = new Map<number, typeof slots>();
  for (const s of slots) {
    const arr = byWeekday.get(s.weekday) ?? [];
    arr.push(s);
    byWeekday.set(s.weekday, arr);
  }
  const out: UpcomingDay[] = [];
  const start = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const wd = ((d.getDay() + 6) % 7) + 1; // 1..7 Mon..Sun
    const daySlots = (byWeekday.get(wd) ?? []).slice().sort((a, b) => a.period.idx - b.period.idx);
    if (daySlots.length === 0) continue;
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }),
      classes: daySlots.map((s) => ({ subjectId: s.subject.id, name: s.subject.name, code: s.subject.code, periodId: s.period.id })),
    });
  }
  return out;
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
