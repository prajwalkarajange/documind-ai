import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl shadow-soft">
        <BrainCircuit className="size-5 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="text-base font-semibold tracking-tight">
          DocuMind <span className="text-brand-gradient">AI</span>
        </span>
      )}
    </span>
  );
}