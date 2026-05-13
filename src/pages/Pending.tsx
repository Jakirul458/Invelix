import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useNavigate } from "react-router-dom";

export default function Pending() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-auth px-4">
      <Card className="max-w-lg w-full p-10 text-center shadow-lg">
        <div className="h-14 w-14 mx-auto rounded-full bg-warning/15 grid place-items-center mb-5">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Account pending activation</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your account <span className="font-medium text-foreground">{user?.email}</span> has been created.
          An administrator needs to activate it before you can access the dashboard.
        </p>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
