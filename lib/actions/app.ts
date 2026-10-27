"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSemesterId } from "@/lib/data/queries";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

/** Ensure the student has an active semester; create a default one on first use. */
export async function ensureActiveSemester(): Promise<string> {
  const existing = await getActiveSemesterId();
  if (existing) return existing;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("semesters")
    .insert({ user_id: user.id, name: "Current semester", is_active: true })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

const subjectSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(20),
  name: z.string().trim().min(1, "Name is required").max(80),
  credits: z.coerce.number().positive("Credits must be greater than 0").max(20),
  kind: z.enum(["theory", "lab", "both"]),
});

export async function createSubject(formData: FormData) {
  const parsed = subjectSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    credits: formData.get("credits"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { supabase, user } = await requireUser();
  const semesterId = await ensureActiveSemester();
  const palette = ["accent-attendance", "accent-marks", "accent-calendar", "accent-schedule", "accent-hero"];
  const { count } = await supabase
    .from("subjects")
    .select("id", { count: "exact", head: true })
    .eq("semester_id", semesterId);
  const color = palette[(count ?? 0) % palette.length];
  const { error } = await supabase.from("subjects").insert({
    user_id: user.id,
    semester_id: semesterId,
    code: parsed.data.code,
    name: parsed.data.name,
    credits: parsed.data.credits,
    kind: parsed.data.kind,
    color_token: color,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/subjects");
  revalidatePath("/today");
  revalidatePath("/attendance");
  return { ok: true as const };
}

export async function deleteSubject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/subjects");
  revalidatePath("/today");
  revalidatePath("/attendance");
}

const statusSchema = z.enum(["present", "absent", "cancelled", "unmarked"]);
const isoSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bad date");

const DEFAULT_PERIODS: [string, string][] = [
  ["09:00", "09:50"],
  ["10:00", "10:50"],
  ["11:00", "11:50"],
  ["12:00", "12:50"],
  ["13:30", "14:20"],
  ["14:30", "15:20"],
  ["15:30", "16:20"],
  ["16:30", "17:20"],
];

/** Ensure the semester has the default bell schedule (P1..P8). Returns period ids by idx. */
async function ensureDefaultPeriods(semesterId: string, userId: string): Promise<Map<number, string>> {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("periods")
    .select("id, idx")
    .eq("semester_id", semesterId)
    .order("idx");
  if (existing && existing.length > 0) return new Map(existing.map((p) => [p.idx, p.id]));

  const rows = DEFAULT_PERIODS.map(([starts_at, ends_at], i) => ({
    user_id: userId,
    semester_id: semesterId,
    idx: i + 1,
    starts_at,
    ends_at,
  }));
  const { data, error } = await supabase.from("periods").insert(rows).select("id, idx");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((p) => [p.idx, p.id]));
}

const weekdaySchema = z.coerce.number().int().min(1).max(7);

/** Add a class to a weekday: assigns the next free period slot that day. */
export async function addClass(weekday: number, subjectId: string) {
  const wd = weekdaySchema.parse(weekday);
  const { supabase, user } = await requireUser();
  const semesterId = await ensureActiveSemester();
  const periods = await ensureDefaultPeriods(semesterId, user.id);

  const { data: taken } = await supabase
    .from("timetable_slots")
    .select("period_id")
    .eq("semester_id", semesterId)
    .eq("weekday", wd);
  const takenIds = new Set((taken ?? []).map((t) => t.period_id));

  let periodId: string | undefined;
  for (const [, id] of [...periods.entries()].sort((a, b) => a[0] - b[0])) {
    if (!takenIds.has(id)) {
      periodId = id;
      break;
    }
  }
  if (!periodId) return { ok: false as const, error: "That day is full (8 periods)." };

  const { error } = await supabase.from("timetable_slots").insert({
    user_id: user.id,
    semester_id: semesterId,
    weekday: wd,
    period_id: periodId,
    subject_id: subjectId,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/timetable");
  revalidatePath("/attendance");
  return { ok: true as const };
}

/** Set (or clear) a subject's final grade. */
export async function setGrade(subjectId: string, grade: string) {
  const { supabase, user } = await requireUser();
  if (!grade) {
    await supabase.from("subject_results").delete().eq("subject_id", subjectId).eq("attempt", 1);
  } else {
    const { data: existing } = await supabase
      .from("subject_results")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("attempt", 1)
      .maybeSingle();
    if (existing) await supabase.from("subject_results").update({ grade }).eq("id", existing.id);
    else await supabase.from("subject_results").insert({ user_id: user.id, subject_id: subjectId, grade, attempt: 1 });
  }
  revalidatePath("/marks");
}

export async function removeSlot(slotId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("timetable_slots").delete().eq("id", slotId);
  if (error) throw new Error(error.message);
  revalidatePath("/timetable");
  revalidatePath("/attendance");
}

/** Set one class's status on a date. periodId distinguishes repeated subjects; null = fallback grain. */
export async function markSession(subjectId: string, iso: string, status: string, periodId?: string | null) {
  const s = statusSchema.parse(status);
  const day = isoSchema.parse(iso);
  const { supabase, user } = await requireUser();

  let q = supabase.from("class_sessions").select("id").eq("subject_id", subjectId).eq("day", day);
  q = periodId ? q.eq("period_id", periodId) : q.is("period_id", null);
  const { data: existing } = await q.maybeSingle();

  if (s === "unmarked") {
    if (existing) await supabase.from("class_sessions").delete().eq("id", existing.id);
  } else if (existing) {
    const { error } = await supabase.from("class_sessions").update({ status: s }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("class_sessions")
      .insert({ user_id: user.id, subject_id: subjectId, day, status: s, period_id: periodId ?? null });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/attendance");
  revalidatePath("/today");
}

/** Mark every class scheduled that day present/absent (skips existing 'cancelled'). */
export async function markWholeDay(
  iso: string,
  status: string,
  classes: { subjectId: string; periodId: string | null }[],
) {
  const s = statusSchema.parse(status);
  const day = isoSchema.parse(iso);
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("id, subject_id, period_id, status")
    .eq("day", day);
  const exByKey = new Map((existing ?? []).map((e) => [`${e.subject_id}:${e.period_id ?? ""}`, e]));

  const inserts: { user_id: string; subject_id: string; day: string; status: string; period_id: string | null }[] = [];
  for (const c of classes) {
    const ex = exByKey.get(`${c.subjectId}:${c.periodId ?? ""}`);
    if (ex?.status === "cancelled") continue;
    if (ex) await supabase.from("class_sessions").update({ status: s }).eq("id", ex.id);
    else inserts.push({ user_id: user.id, subject_id: c.subjectId, day, status: s, period_id: c.periodId });
  }
  if (inserts.length) await supabase.from("class_sessions").insert(inserts);
  revalidatePath("/attendance");
  revalidatePath("/today");
}
