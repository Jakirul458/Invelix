import { supabase } from '@/integrations/supabase/client';
import { PaytmInitiateResponse } from '@/types/subscription';

const PAYTM_MID = import.meta.env.VITE_PAYTM_MID;
const PAYTM_WEBSITE = import.meta.env.VITE_PAYTM_WEBSITE;
const PAYTM_ENVIRONMENT = import.meta.env.VITE_PAYTM_ENVIRONMENT;

/**
 * Initiate Paytm transaction
 * Calls Supabase Edge Function to generate txnToken securely
 */
export const initiatePaytmTransaction = async (): Promise<PaytmInitiateResponse> => {
  try {
    const response = await supabase.functions.invoke('initiate-paytm-transaction', {
      body: {},
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      success: true,
      txnToken: response.data.txnToken,
      orderId: response.data.orderId,
      amount: response.data.amount,
      mid: response.data.mid,
    };
  } catch (error) {
    console.error('Error initiating Paytm transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment'
    };
  }
};

/**
 * Verify Paytm payment response
 * Calls Supabase Edge Function for secure verification
 */
export const verifyPaytmPayment = async (
  paytmResponse: Record<string, any>
): Promise<PaytmInitiateResponse> => {
  try {
    const response = await supabase.functions.invoke('verify-paytm-payment', {
      body: paytmResponse
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      success: response.data.success,
      transactionId: response.data.transactionId,
      orderId: response.data.orderId,
      amount: response.data.amount,
      error: response.data.error
    };
  } catch (error) {
    console.error('Error verifying Paytm payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment'
    };
  }
};

/**
 * Open Paytm Checkout
 */
export const openPaytmCheckout = (
  orderId: string,
  txnToken: string,
  amount: number,
  email: string,
  phone: string,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  // Paytm Checkout configuration
  const config = {
    root: '',
    flow: 'DEFAULT',
    data: {
      orderId: orderId,
      token: txnToken,
      tokenType: 'TXN_TOKEN',
      amount: String(amount)
    },
    handler: {
      notifyMerchant: function (eventName: string, data: any) {
        console.log('Paytm event:', eventName, data);
        if (eventName === 'txnSuccess') {
          onSuccess();
        } else if (eventName === 'txnFailure') {
          onError('Payment failed');
        }
      }
    }
  };

  if ((window as any).Paytm && (window as any).Paytm.CheckoutJS) {
    (window as any).Paytm.CheckoutJS.onNewwindow = () => {
      return true;
    };
    (window as any).Paytm.CheckoutJS.init(config)
      .then(() => {
        (window as any).Paytm.CheckoutJS.launch();
      })
      .catch((error: any) => {
        console.error('Paytm checkout error:', error);
        onError('Failed to open payment gateway');
      });
  } else {
    onError('Payment gateway not available');
  }
};

/**
 * Create subscription record after successful payment
 */
export const createSubscriptionRecord = async (
  userId: string,
  orderId: string,
  paymentId: string,
  amount: number,
  isFirstPurchase: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        order_id: orderId,
        payment_id: paymentId,
        amount,
        payment_status: 'success',
        is_first_purchase: isFirstPurchase
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error creating subscription record:', error);
    return false;
  }
};
