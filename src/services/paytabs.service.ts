/**
 * PayTabs Payment Service
 * Handles all payment-related API calls to Supabase Edge Functions
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  PayTabsConfig,
} from '@/types/paytabs';

class PayTabsService {
  private config: PayTabsConfig;

  constructor() {
    this.config = {
      profileId: import.meta.env.VITE_PAYTABS_PROFILE_ID || '',
      clientKey: import.meta.env.VITE_PAYTABS_CLIENT_KEY || '',
      region: import.meta.env.VITE_PAYTABS_REGION || 'EGY',
      currency: import.meta.env.VITE_PAYTABS_CURRENCY || 'EGP',
    };

    // Validate configuration
    if (!this.config.profileId || !this.config.clientKey) {
      console.warn('PayTabs credentials not configured. Please add them to .env file.');
    }
  }

  /**
   * Validate configuration before making requests
   */
  private validateConfig(): void {
    if (!this.config.profileId || !this.config.clientKey) {
      throw new Error(
        'PayTabs is not properly configured. Please check your environment variables.'
      );
    }
  }

  /**
   * Initiate a payment transaction
   * This will create a PayTabs payment session and return a redirect URL
   */
  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    this.validateConfig();

    try {
      console.log('Initiating PayTabs payment with data:', paymentData);

      const requestBody = {
        ...paymentData,
        config: {
          profileId: this.config.profileId,
          region: this.config.region,
          currency: this.config.currency,
        },
        returnUrl: `${window.location.origin}/payment-callback`,
        cancelUrl: `${window.location.origin}/payment-failed`,
      };

      console.log('Sending to payTabs_test:', requestBody);

      const response = await supabase.functions.invoke('payTabs_test', {
        body: requestBody,
      });

      console.log('Full PayTabs response:', response);

      const { data, error } = response;

      if (error) {
        console.error('PayTabs payment initiation error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Try to get the actual error message from the response
        let errorMessage = 'Failed to initiate payment';

        if (error.message) {
          errorMessage = error.message;
        }

        // Check if there's error data in the response
        if (data && typeof data === 'object') {
          console.error('Error data from function:', data);
          if (data.error) errorMessage = data.error;
          if (data.message) errorMessage = data.message;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Payment initiation failed';
        console.error('PayTabs returned error:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        redirectUrl: data.redirectUrl,
        transactionRef: data.transactionRef,
      };
    } catch (error) {
      console.error('PayTabs service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Verify a payment transaction after redirect
   * This should be called on the callback page to confirm payment status
   */
  async verifyPayment(
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    this.validateConfig();

    try {
      const { data, error } = await supabase.functions.invoke('paytabs-verify', {
        body: {
          transactionRef: request.transactionRef,
          config: {
            profileId: this.config.profileId,
            region: this.config.region,
          },
        },
      });

      if (error) {
        console.error('PayTabs verification error:', error);
        return {
          success: false,
          transactionRef: request.transactionRef,
          paymentStatus: 'failed' as any,
          amount: 0,
          currency: this.config.currency,
          error: error.message || 'Failed to verify payment',
        };
      }

      return data;
    } catch (error) {
      console.error('PayTabs verification service error:', error);
      return {
        success: false,
        transactionRef: request.transactionRef,
        paymentStatus: 'failed' as any,
        amount: 0,
        currency: this.config.currency,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get payment configuration
   */
  getConfig(): Readonly<PayTabsConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Check if PayTabs is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.profileId && this.config.clientKey);
  }
}

// Export singleton instance
export const payTabsService = new PayTabsService();

// Export class for testing
export default PayTabsService;
