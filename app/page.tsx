import { redirect } from "next/navigation";

export default function Home() {
  // Phase 4 adds auth; an unauthenticated visitor will land on the public welcome page instead.
  redirect("/today");
}
