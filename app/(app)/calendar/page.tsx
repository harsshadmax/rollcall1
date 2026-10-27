import { getMonthAttendance } from "@/lib/data/queries";
import { EmojiCalendar } from "@/components/features/EmojiCalendar";

export const metadata = { title: "Calendar · RollCall" };

function thisYm() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const { ym } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(ym ?? "") ? (ym as string) : thisYm();
  const data = await getMonthAttendance(month);
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Attendance calendar
      </h1>
      <EmojiCalendar data={data} ym={month} />
    </>
  );
}
