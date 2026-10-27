import { listSubjects } from "@/lib/data/queries";
import { SubjectsManager } from "@/components/features/SubjectsManager";

export const metadata = { title: "Subjects · RollCall" };

export default async function SubjectsPage() {
  const subjects = await listSubjects();
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Subjects
      </h1>
      <SubjectsManager subjects={subjects} />
    </>
  );
}
