import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/lib/forms";

/** Shows the top-level success/error message of a FormState. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message || state.status === "idle") return null;
  return <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>;
}
