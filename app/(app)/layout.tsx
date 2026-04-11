import { AppShell } from "@/components/layout/AppShell";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <PwaInstallPrompt />
    </>
  );
}
