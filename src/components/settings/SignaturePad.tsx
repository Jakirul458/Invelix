import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, Check, Loader2 } from "lucide-react";

interface Props {
  onSave: (blob: Blob) => Promise<void> | void;
  saving?: boolean;
}

export function SignaturePad({ onSave, saving }: Props) {
  const ref = useRef<SignatureCanvas>(null);
  const [empty, setEmpty] = useState(true);

  const clear = () => {
    ref.current?.clear();
    setEmpty(true);
  };

  const save = async () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const dataUrl = ref.current.getTrimmedCanvas().toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await onSave(blob);
  };

  return (
    <div className="space-y-3">
      <Card className="p-2 bg-white">
        <SignatureCanvas
          ref={ref}
          onEnd={() => setEmpty(false)}
          penColor="black"
          canvasProps={{ className: "w-full h-40 rounded border border-dashed border-muted-foreground/30" }}
        />
      </Card>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <Eraser className="h-4 w-4 mr-2" /> Clear
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={empty || saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save signature
        </Button>
      </div>
    </div>
  );
}
