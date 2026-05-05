import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Phone, MapPin, Clock, LogIn, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface SigninUser {
  id: string;
  email: string;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_active: boolean;
  created_at: string;
  last_signin_at: string | null;
  signin_count: number;
}

export function SigninStatistics() {
  const [users, setUsers] = useState<SigninUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"signin_count" | "last_signin" | "joined">("signin_count");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("owners")
        .select(
          `id, email, business_name, phone, address, city, state, postal_code,
           is_active, created_at, last_signin_at, signin_count`
        )
        .order("signin_count", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getSortedUsers = () => {
    let sorted = [...users];
    if (sortBy === "signin_count") {
      sorted.sort((a, b) => (b.signin_count || 0) - (a.signin_count || 0));
    } else if (sortBy === "last_signin") {
      sorted.sort((a, b) => {
        const timeA = a.last_signin_at ? new Date(a.last_signin_at).getTime() : 0;
        const timeB = b.last_signin_at ? new Date(b.last_signin_at).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortBy === "joined") {
      sorted.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return sorted;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFullAddress = (user: SigninUser) => {
    const parts = [user.address, user.city, user.state, user.postal_code].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  const totalSignins = users.reduce((sum, u) => sum + (u.signin_count || 0), 0);
  const activeUsers = users.filter((u) => u.is_active).length;
  const usersWithSignins = users.filter((u) => (u.signin_count || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-1">{users.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active</p>
              <p className="text-3xl font-bold mt-1">{activeUsers}</p>
            </div>
            <LogIn className="h-8 w-8 text-green-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Users Signed In</p>
              <p className="text-3xl font-bold mt-1">{usersWithSignins}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Signins</p>
              <p className="text-3xl font-bold mt-1">{totalSignins}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500/30" />
          </div>
        </Card>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort by:</span>
        <div className="flex gap-2">
          {[
            { value: "signin_count" as const, label: "Signin Count" },
            { value: "last_signin" as const, label: "Last Signin" },
            { value: "joined" as const, label: "Recently Joined" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                sortBy === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Email & Business</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="text-center font-semibold">Signins</TableHead>
                  <TableHead className="font-semibold">Last Signin</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedUsers().map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">{user.email}</div>
                        {user.business_name ? (
                          <div className="text-xs text-muted-foreground">{user.business_name}</div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">No business set</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.address || user.city || user.state ? (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-xs">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{getFullAddress(user)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge
                          variant={user.signin_count > 10 ? "default" : "secondary"}
                          className="font-semibold"
                        >
                          {user.signin_count}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_signin_at ? (
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {formatDate(user.last_signin_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(user.last_signin_at)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-700 border-0"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
