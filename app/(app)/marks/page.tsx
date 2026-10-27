import { getMarks } from "@/lib/data/queries";
import { MarksManager } from "@/components/features/MarksManager";

export const metadata = { title: "Marks & CGPA · RollCall" };

export default async function MarksPage() {
  const data = await getMarks();
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Marks &amp; CGPA
      </h1>
      <MarksManager data={data} />
    </>
  );
}
