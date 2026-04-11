"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LiquidBackdrop } from "@/components/layout/LiquidBackdrop";
import { ParticleField } from "@/components/layout/ParticleField";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LiquidBackdrop />
      <ParticleField />
      <div className="flex min-h-dvh w-full min-w-0 max-w-[100vw] overflow-x-hidden">
        <AppSidebar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
          <main
            id="main-content"
            className="flex-1 min-w-0 overflow-x-hidden px-3 py-6 sm:px-4 md:px-8"
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <MobileDrawer />
    </>
  );
}
