import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, Shield, Users, CheckCircle2, XCircle, Trash2, AlertCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/subscription";

type OwnerProfile = Profile;

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: OwnerProfile | null }>({
    open: false,
    user: null,
  });
  const [extendDialog, setExtendDialog] = useState<{ open: boolean; user: OwnerProfile | null }>({
    open: false,
    user: null,
  });
  const [extendDays, setExtendDays] = useState("365");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "owner")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    } else {
      setUsers((data as OwnerProfile[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const syncOwnerActive = async (userId: string, active: boolean) => {
    await supabase.from("owners").update({ is_active: active }).eq("id", userId);
  };

  const activateUser = async (user: OwnerProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "active", subscription_status: user.subscription_status === "suspended" ? "trial" : user.subscription_status })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    await syncOwnerActive(user.id, true);
    toast({ title: "User activated" });
    load();
  };

  const suspendUser = async (user: OwnerProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "suspended", subscription_status: "suspended" })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    await syncOwnerActive(user.id, false);
    toast({ title: "User suspended" });
    load();
  };

  const manuallyActivateSubscription = async (user: OwnerProfile) => {
    const now = new Date();
    const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("profiles")
      .update({
        account_status: "active",
        subscription_status: "active",
        subscription_expires_at: end.toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    await syncOwnerActive(user.id, true);
    toast({ title: "Subscription activated", description: "1 year access granted." });
    load();
  };

  const extendSubscription = async () => {
    const user = extendDialog.user;
    if (!user) return;

    const days = parseInt(extendDays, 10);
    if (!Number.isFinite(days) || days < 1) {
      toast({ title: "Invalid days", variant: "destructive" });
      return;
    }

    const base = user.subscription_expires_at ? new Date(user.subscription_expires_at) : new Date();
    const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: newEnd.toISOString(),
        account_status: "active",
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Extend failed", description: error.message, variant: "destructive" });
      return;
    }

    await syncOwnerActive(user.id, true);
    toast({ title: "Subscription extended" });
    setExtendDialog({ open: false, user: null });
    load();
  };

  const deleteUser = async (user: OwnerProfile) => {
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError && !authError.message.includes("not found")) {
      toast({ title: "Delete failed", description: authError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Account deleted" });
    setDeleteDialog({ open: false, user: null });
    load();
  };

  const activeCount = users.filter((u) => u.account_status === "active").length;
  const suspendedCount = users.filter((u) => u.account_status === "suspended").length;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Admin Console</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accounts, trials, and subscriptions. No activity tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total users</p>
            <p className="text-2xl font-bold mt-1">{users.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active accounts</p>
            <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-2xl font-bold mt-1">{suspendedCount}</p>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Registered business owners</span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Trial ends</TableHead>
                    <TableHead>Sub. ends</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.account_status === "active" ? "default" : "secondary"}>
                          {u.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.subscription_status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(u.trial_end_date)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(u.subscription_expires_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(u.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {u.account_status !== "active" && (
                            <Button size="sm" variant="default" onClick={() => activateUser(u)}>
                              Activate
                            </Button>
                          )}
                          {u.account_status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => suspendUser(u)}>
                              Suspend
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setExtendDialog({ open: true, user: u })}>
                            Extend
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => manuallyActivateSubscription(u)}>
                            Activate sub
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialog({ open: true, user: u })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>

      <Dialog open={extendDialog.open} onOpenChange={(open) => setExtendDialog({ ...extendDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="extend-days">Additional days</Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={extendSubscription}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Delete user</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{deleteDialog.user?.email}</span>? This removes
              their account and business data. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog.user && deleteUser(deleteDialog.user)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
