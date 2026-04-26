import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, Shield, Users, CheckCircle2, XCircle, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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

interface Owner {
  id: string;
  email: string;
  business_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; owner: Owner | null }>({
    open: false,
    owner: null,
  });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("owners")
      .select("id, email, business_name, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setOwners(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const isActivating = !current;

    const { error: ownerError } = await supabase
      .from("owners")
      .update({ is_active: isActivating })
      .eq("id", id);

    if (ownerError) {
      toast({ title: "Update failed", description: ownerError.message, variant: "destructive" });
      return;
    }

    if (isActivating) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email_confirmed_at: new Date().toISOString(),
      });
      if (authError) {
        console.warn("Email confirmation update:", authError.message);
      }
    }

    toast({ title: isActivating ? "Account activated" : "Account deactivated" });
    load();
  };

  const deleteOwner = async (owner: Owner) => {
    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(owner.id);
    if (authError && !authError.message.includes("not found")) {
      toast({ title: "Delete failed", description: authError.message, variant: "destructive" });
      return;
    }

    // Delete owner record (cascade will handle related data)
    const { error: ownerError } = await supabase
      .from("owners")
      .delete()
      .eq("id", owner.id);

    if (ownerError) {
      toast({ title: "Delete failed", description: ownerError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Account deleted successfully" });
    setDeleteDialog({ open: false, owner: null });
    load();
  };

  const activeCount = owners.filter((o) => o.is_active).length;
  const inactiveCount = owners.length - activeCount;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
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
          <h1 className="text-3xl font-semibold tracking-tight">Owners Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Activate, deactivate, and manage business accounts.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold mt-1">{owners.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/40" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-muted-foreground mt-1">{inactiveCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </Card>
        </div>

        {/* Owners Table */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{owners.length} total accounts</span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : owners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((o) => (
                    <TableRow key={o.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{o.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{o.business_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(o.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        {o.is_active ? (
                          <Badge className="bg-success/15 text-success hover:bg-success/15 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted/50">
                            <XCircle className="h-3 w-3 mr-1" /> Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={o.is_active ? "outline" : "default"}
                            onClick={() => toggleActive(o.id, o.is_active)}
                          >
                            {o.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => setDeleteDialog({ open: true, owner: o })}
                          >
                            <Trash2 className="h-3 w-3" /> Delete
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteDialog.owner?.email}</span>?
              <br />
              <span className="text-xs mt-2 block">This will delete the account and all associated data (invoices, products, etc.). This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog.owner && deleteOwner(deleteDialog.owner)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
