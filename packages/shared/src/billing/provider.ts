// Payment logic sits behind this single interface (packages/shared) so Onvo can
// be swapped/extended later. Two concerns, one provider today. See build-kit §7.

export type BillingEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.deferred"
  | "subscription.renewal.succeeded"
  | "subscription.renewal.failed"
  | "checkout.succeeded"
  | "mobile_transfer.received";

export interface BillingEvent {
  id: string;
  type: BillingEventType;
  data: unknown;
}

export interface BillingProvider {
  // --- Flow A: OUR subscriptions (recurring) ---
  ensureCustomer(input: {
    tenantId: string;
    email: string;
    name: string;
  }): Promise<{ customerId: string }>;
  createSubscription(input: {
    customerId: string;
    priceId: string;
    seats: number;
    paymentBehavior?: "immediate" | "allow_incomplete";
  }): Promise<{ subscriptionId: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  changeSubscription(input: {
    subscriptionId: string;
    priceId?: string;
    seats?: number;
  }): Promise<void>;

  // --- Flow B: per-visit patient charges (one-off ONLY, no recurring) ---
  createOneOffCharge(input: {
    amountCents: number;
    currency: string;
    description: string;
    method: "card" | "sinpe";
    metadata: Record<string, string>;
  }): Promise<{ paymentIntentId: string; status: string; hostedUrl?: string }>;

  // --- Webhooks ---
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
  parseEvent(rawBody: string): BillingEvent;
}
