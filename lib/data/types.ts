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
