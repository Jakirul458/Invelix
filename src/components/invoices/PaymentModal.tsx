import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { inr } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  finalAmount: number;
  paidAmount: number;
  submitting?: boolean;
  onSubmit: (newPaid: number) => Promise<void> | void;
}

export function PaymentModal({ open, onOpenChange, finalAmount, paidAmount, submitting, onSubmit }: Props) {
  const due = Math.max(0, finalAmount - paidAmount);
  const [add, setAdd] = useState<number>(due);

  useEffect(() => {
    if (open) setAdd(due);
  }, [open, due]);

  const newPaid = Math.min(finalAmount, paidAmount + (Number(add) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-mono font-semibold mt-1">{inr(finalAmount)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Paid</div>
              <div className="font-mono font-semibold mt-1">{inr(paidAmount)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Due</div>
              <div className="font-mono font-semibold mt-1 text-warning">{inr(due)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to add (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              max={due}
              value={add}
              onChange={(e) => setAdd(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">New paid total: <span className="font-mono">{inr(newPaid)}</span></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(newPaid)} disabled={submitting || due <= 0}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
