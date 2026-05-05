import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getOwnerActivityLogs, formatActivityTime, getActivityLabel, getActivityColor } from "@/lib/activity-logger";
import { Loader2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OwnerActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  ownerEmail: string;
}

export function OwnerActivityDialog({
  open,
  onOpenChange,
  ownerId,
  ownerEmail,
}: OwnerActivityDialogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ownerId) {
      loadLogs();
    }
  }, [open, ownerId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getOwnerActivityLogs(ownerId, 100);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </DialogTitle>
          <DialogDescription>{ownerEmail}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="mt-1">
                  <Badge className={getActivityColor(log.activity_type as any)}>
                    {getActivityLabel(log.activity_type as any)}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  {log.description && (
                    <p className="text-sm text-foreground break-words">{log.description}</p>
                  )}
                  {log.ip_address && (
                    <p className="text-xs text-muted-foreground mt-1">IP: {log.ip_address}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatActivityTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
