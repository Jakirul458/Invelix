import { useEffect, useState } from 'react';

/**
 * Load Paytm Checkout JS library
 */
export const usePaytmCheckout = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://securegw.paytm.in/merchantpgp/checkoutjs/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Paytm Checkout');

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return { isLoaded, error };
};
