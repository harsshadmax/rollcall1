export type SubjectKind = "theory" | "lab" | "both";
export type SessionStatus = "present" | "absent" | "cancelled" | "unmarked";

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  kind: SubjectKind;
  color_token: string | null;
  instructor: string | null;
  room: string | null;
  threshold_override: number | null;
}

export interface SubjectStanding extends Subject {
  present: number;
  absent: number;
  held: number;
  pct: number | null;
  threshold: number;
  canSkip: number;
  mustAttend: number | null;
  unrecoverable: boolean;
}

export interface DayRow {
  subject: Subject;
  status: SessionStatus;
}

export interface Period {
  id: string;
  idx: number;
  starts_at: string;
  ends_at: string;
}

/** One class on a given date: from the timetable when set, else a plain subject row. */
export interface ScheduleRow {
  slotId: string | null;
  periodId: string | null;
  time: string | null;
  subject: Subject;
  status: SessionStatus;
}

export interface UpcomingDay {
  iso: string;
  label: string;
  classes: { subjectId: string; name: string; code: string; periodId: string }[];
}

/** A timetable slot in the weekly grid. */
export interface SlotRow {
  slotId: string;
  weekday: number; // 1 = Mon .. 7 = Sun
  period: Period;
  subject: Subject;
}
