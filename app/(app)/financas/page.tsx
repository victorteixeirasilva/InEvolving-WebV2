"use client";

import { useState } from "react";
import { FinancasPageContent } from "@/components/features/financas/FinancasPageContent";
import { CompartilharFinancasModal } from "@/components/features/financas/CompartilharFinancasModal";

export default function FinancasPage() {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <FinancasPageContent onShareClick={() => setShareOpen(true)} />
      <CompartilharFinancasModal open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
