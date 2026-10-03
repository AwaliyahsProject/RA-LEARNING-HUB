"use client";

import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

// Raw error details are intentionally not shown; Next.js logs them server-side.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      action={
        <Button variant="secondary" onClick={reset}>
          <RotateCcw aria-hidden className="size-4" />
          Coba lagi
        </Button>
      }
    />
  );
}
