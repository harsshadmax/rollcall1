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

/** Set one subject's status on a date (upsert on user+subject+day). */
export async function markSession(subjectId: string, iso: string, status: string) {
  const s = statusSchema.parse(status);
  const day = isoSchema.parse(iso);
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("day", day)
    .maybeSingle();

  if (s === "unmarked") {
    if (existing) await supabase.from("class_sessions").delete().eq("id", existing.id);
  } else if (existing) {
    const { error } = await supabase.from("class_sessions").update({ status: s }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("class_sessions")
      .insert({ user_id: user.id, subject_id: subjectId, day, status: s });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/attendance");
  revalidatePath("/today");
}

/** Mark every subject of the day present/absent at once (skips existing 'cancelled'). */
export async function markWholeDay(iso: string, status: string) {
  const s = statusSchema.parse(status);
  const day = isoSchema.parse(iso);
  const { supabase, user } = await requireUser();
  const semesterId = await getActiveSemesterId();
  if (!semesterId) return;

  const { data: subjects } = await supabase.from("subjects").select("id").eq("semester_id", semesterId);
  const { data: existing } = await supabase.from("class_sessions").select("id, subject_id, status").eq("day", day);
  const exBySubject = new Map((existing ?? []).map((e) => [e.subject_id, e]));

  const inserts: { user_id: string; subject_id: string; day: string; status: string }[] = [];
  for (const subj of subjects ?? []) {
    const ex = exBySubject.get(subj.id);
    if (ex?.status === "cancelled") continue;
    if (ex) {
      await supabase.from("class_sessions").update({ status: s }).eq("id", ex.id);
    } else {
      inserts.push({ user_id: user.id, subject_id: subj.id, day, status: s });
    }
  }
  if (inserts.length) await supabase.from("class_sessions").insert(inserts);
  revalidatePath("/attendance");
  revalidatePath("/today");
}
