import { getTimetable, listSubjects } from "@/lib/data/queries";
import { TimetableEditor } from "@/components/features/TimetableEditor";

export const metadata = { title: "Timetable · RollCall" };

export default async function TimetablePage() {
  const [slots, subjects] = await Promise.all([getTimetable(), listSubjects()]);
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Timetable
      </h1>
      <TimetableEditor slots={slots} subjects={subjects} />
    </>
  );
}
