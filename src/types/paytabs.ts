/**
 * PayTabs Payment Gateway Types
 * Documentation: https://support.paytabs.com
 */

export interface PayTabsConfig {
  profileId: string;
  clientKey: string;
  serverKey?: string; // Only for backend
  region: string; // e.g., 'EGY' for Egypt
  currency: string; // e.g., 'EGP'
}

export interface PaymentCustomerInfo {
  name: string;
  email: string;
  phone: string;
  street1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface PaymentBookingDetails {
  propertyId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  bookingType: 'daily' | 'monthly';
  durationMonths?: number;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  bookingDetails: PaymentBookingDetails;
  customerInfo: PaymentCustomerInfo;
  promoCodeId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  transactionRef?: string;
  message?: string;
  error?: string;
}

export interface PaymentVerificationRequest {
  transactionRef: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  transactionRef: string;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  bookingId?: string;
  message?: string;
  error?: string;
  paymentDetails?: {
    cardType?: string;
    cardScheme?: string;
    paymentDescription?: string;
    transactionTime?: string;
  };
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
}

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

// PayTabs callback parameters (returned via URL)
export interface PayTabsCallbackParams {
  tranRef?: string;
  cartId?: string;
  respStatus?: string;
  respCode?: string;
  respMessage?: string;
  token?: string;
  paymentMethod?: string;
  acquirerMessage?: string;
  acquirerRRN?: string;
}
