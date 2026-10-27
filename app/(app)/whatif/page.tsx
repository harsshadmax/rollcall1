import { getStandings, getUpcoming } from "@/lib/data/queries";
import { WhatIfPlanner } from "@/components/features/WhatIfPlanner";

export const metadata = { title: "Can I skip? · RollCall" };

export default async function WhatIfPage() {
  const [{ subjects }, upcoming] = await Promise.all([getStandings(), getUpcoming(14)]);
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Can I skip?
      </h1>
      <WhatIfPlanner
        standings={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          present: s.present,
          held: s.held,
          threshold: s.threshold,
        }))}
        upcoming={upcoming}
      />
    </>
  );
}
