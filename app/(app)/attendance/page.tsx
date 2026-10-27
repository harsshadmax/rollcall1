import { getDay } from "@/lib/data/queries";
import { DayAttendance } from "@/components/features/DayAttendance";

export const metadata = { title: "Attendance · RollCall" };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(day ?? "") ? (day as string) : todayIso();
  const rows = await getDay(iso);
  return <DayAttendance day={iso} rows={rows} />;
}
