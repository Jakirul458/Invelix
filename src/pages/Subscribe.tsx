import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Loader } from 'lucide-react';
import { initiatePaytmTransaction, openPaytmCheckout, createSubscriptionRecord } from '@/lib/paytm-service';
import { usePaytmCheckout } from '@/hooks/usePaytmCheckout';
import { isFirstPurchase, getSubscriptionPrice, activateSubscription } from '@/lib/subscription-helpers';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, subscriptionStatus } = useSubscriptionStatus();
  const { isLoaded: paytmLoaded } = usePaytmCheckout();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const handlePayment = async () => {
    if (!paytmLoaded) {
      setError('Payment gateway is loading. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is first purchase
      const response = await initiatePaytmTransaction();

      if (!response.success || !response.txnToken || !response.orderId) {
        throw new Error(response.error || 'Failed to initiate payment');
      }

      const checkoutAmount =
        response.amount ?? getSubscriptionPrice(await isFirstPurchase(user.id));

      openPaytmCheckout(
        response.orderId,
        response.txnToken,
        checkoutAmount,
        user.email!,
        profile.phone || '',
        () => {
          // Success callback
          navigate('/dashboard');
        },
        (error: string) => {
          setError(error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsLoading(false);
    }
  };

  const isFirstTime = subscriptionStatus?.isFirstPurchase ?? true;
  const amount = getSubscriptionPrice(isFirstTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Upgrade to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-xl text-slate-300">
            Get unlimited access to all Invelix features
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30 mb-8 p-4">
            <p className="text-red-300">{error}</p>
          </Card>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Annual Plan */}
          <Card className={`border-2 transition-all ${
            selectedPlan === 'annual' 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400' 
              : 'bg-slate-900/50 border-slate-700'
          } p-8 cursor-pointer relative`}
          onClick={() => setSelectedPlan('annual')}
          >
            {selectedPlan === 'annual' && (
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Annual Plan</h3>
              <p className="text-slate-400 text-sm">Best value for your business</p>
            </div>

            <div className="mb-6">
              <div className="text-5xl font-bold text-white">
                ₹{amount}
              </div>
              <p className="text-slate-400 text-sm mt-2">/year</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">Unlimited invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">Unlimited products</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">Barcode generation</span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className={`w-full ${
                selectedPlan === 'annual'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              } text-white`}
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </Button>
          </Card>

          {/* Monthly Plan - Coming Soon */}
          <Card className="bg-slate-900/50 border-slate-700 border-2 p-8 opacity-50 relative">
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <span className="text-white font-semibold">Coming Soon</span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Monthly Plan</h3>
              <p className="text-slate-400 text-sm">Flexible billing</p>
            </div>

            <div className="mb-6">
              <div className="text-5xl font-bold text-white">
                ₹299
              </div>
              <p className="text-slate-400 text-sm mt-2">/month</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-300">All annual features</span>
              </div>
            </div>

            <Button disabled className="w-full bg-slate-700 text-white cursor-not-allowed">
              Coming Soon
            </Button>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="bg-slate-900/50 border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400">
                Yes, you can cancel your subscription anytime. Once cancelled, you'll lose access to premium features at the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-400">
                We accept all major payment methods through Paytm, including credit cards, debit cards, UPI, net banking, and more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a refund policy?</h3>
              <p className="text-slate-400">
                We offer a 7-day money-back guarantee if you're not satisfied with our service. Contact support@invelix.com for refund requests.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I upgrade later?</h3>
              <p className="text-slate-400">
                Absolutely! You can upgrade to a higher plan anytime from your dashboard settings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
