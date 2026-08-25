import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MAX_UPLOAD_BYTES, documentService } from "@/services/documentService";
import { errorMessage } from "@/services/api";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UploadCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const upload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File is too large. Maximum size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setProgress(0);
    try {
      await documentService.upload(file, setProgress);
      toast.success("Upload complete. Processing started.");
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardContent className="p-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-card/60",
          )}
        >
          <span className="bg-brand-gradient flex size-11 items-center justify-center rounded-2xl shadow-soft">
            <CloudUpload className="size-5 text-primary-foreground" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Drop a PDF here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Up to {formatBytes(MAX_UPLOAD_BYTES)} per file
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={progress !== null}
            onClick={() => inputRef.current?.click()}
          >
            {progress !== null && <Loader2 className="size-4 animate-spin" />} Choose file
          </Button>
          {progress !== null && (
            <div className="w-full max-w-xs">
              <Progress value={progress} />
              <p className="mt-1.5 text-xs text-muted-foreground">Uploading… {progress}%</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
