import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface Props {
  accept?: string;
  label?: string;
  onUpload: (file: File) => Promise<void> | void;
  uploading?: boolean;
}

export function FileUpload({ accept = "image/*", label = "Upload file", onUpload, uploading }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 2 * 1024 * 1024) {
            alert("File too large (max 2MB)");
            return;
          }
          setName(f.name);
          await onUpload(f);
          if (input.current) input.current.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        {label}
      </Button>
      {name && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{name}</span>}
    </div>
  );
}
