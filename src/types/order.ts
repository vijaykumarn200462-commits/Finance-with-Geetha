export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  originalBaseAmount?: number;
  baseCurrency?: string;
  chargedAmount?: number;
  chargedCurrency?: string;
  exchangeRate?: number;
  exchangeRateTimestamp?: string;
  stripeSessionId?: string;
  paymentProvider: string;
  paymentId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
