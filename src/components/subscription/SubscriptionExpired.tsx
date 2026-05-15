import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    navigate('/subscribe');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-orange-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <Card className="bg-slate-900 border-red-500/30 max-w-md w-full">
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h1 className="text-3xl font-bold text-white mb-2">Trial ended</h1>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-slate-300 text-sm text-center">
                Your 14-day free trial has expired. Please purchase a subscription to continue.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                Yes, Subscribe
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
