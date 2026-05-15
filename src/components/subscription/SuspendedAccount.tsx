import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function SuspendedAccount() {
  const [isLoading, setIsLoading] = useState(false);

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@invelix.com';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-orange-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <Card className="bg-slate-900 border-red-500/30 max-w-md w-full">
          <div className="p-8 space-y-6">
            {/* Icon */}
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-3xl font-bold text-white mb-2">Account Suspended</h1>
            </div>

            {/* Message */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-slate-300 text-sm">
                Your account has been suspended by our admin team. This may be due to a policy violation or other terms of service issues.
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-sm">What happens now?</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• You cannot access your dashboard</li>
                <li>• Your data is safely stored</li>
                <li>• Contact support for more information</li>
                <li>• Your account can be reinstated</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleContactSupport}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                Contact Support
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Go to Home
              </Button>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-400">
                Email us at{' '}
                <a href="mailto:support@invelix.com" className="text-cyan-400 hover:text-cyan-300">
                  support@invelix.com
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
