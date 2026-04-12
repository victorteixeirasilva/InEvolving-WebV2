import { LiquidBackdrop } from "@/components/layout/LiquidBackdrop";
import { ParticleField } from "@/components/layout/ParticleField";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh w-full min-w-0 max-w-[100vw] overflow-x-hidden">
      <LiquidBackdrop />
      <ParticleField />
      <main id="main-content" className="min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
