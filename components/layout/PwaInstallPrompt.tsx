"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div
      className="glass-card fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-3 rounded-2xl p-4 shadow-glass-lg sm:left-auto sm:right-6 sm:w-80 lg:bottom-8"
      role="status"
    >
      <p className="text-sm text-[var(--text-primary)]">
        Instale o InEvolving no seu dispositivo para acesso rápido e uso offline parcial.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
            setVisible(false);
          }}
        >
          Instalar app
        </Button>
        <Button type="button" variant="ghost" onClick={() => setVisible(false)}>
          Agora não
        </Button>
      </div>
    </div>
  );
}
