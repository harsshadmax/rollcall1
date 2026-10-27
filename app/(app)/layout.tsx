import { BottomNav } from "@/components/features/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="rc-screen">{children}</main>
      <BottomNav />
    </>
  );
}
