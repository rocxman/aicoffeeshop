export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  snapUrl: string;
}

export interface PaymentTransaction {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName?: string;
    email?: string;
    phone?: string;
  };
  items?: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface SnapPaymentResponse {
  token: string;
  redirect_url: string;
  status_code: string;
  status_message: string;
}

export interface PaymentNotification {
  order_id: string;
  transaction_status: 'pending' | 'capture' | 'settlement' | 'deny' | 'cancel' | 'expire' | 'refund';
  fraud_status?: 'accept' | 'challenge' | 'deny';
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  status_message: string;
  signature_key: string;
}

export interface PaymentStatus {
  orderId: string;
  transactionStatus: string;
  paymentType: string;
  transactionTime: Date | null;
  grossAmount: number;
  currency: string;
  statusCode: string;
}

export interface RefundRequest {
  orderId: string;
  refundAmount: number;
  reason: string;
}

export interface PaymentMethod {
  type: 'qris' | 'gopay' | 'shopeepay' | 'dana' | 'ovo' | 'credit_card' | 'bank_transfer' | 'echannel';
  bank?: string;
  vaNumber?: string;
}
