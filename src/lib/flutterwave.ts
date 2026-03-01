// Flutterwave Payment Integration
// Docs: https://developer.flutterwave.com

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

async function flutterwaveRequest(endpoint: string, method: string, body?: unknown) {
  const response = await fetch(`${FLW_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Flutterwave API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function initializePayment(params: {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod?: string; // card, mobilemoney, bank_transfer, ussd
  redirectUrl: string;
}) {
  const data = await flutterwaveRequest("/payments", "POST", {
    tx_ref: params.orderId,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: {
      email: params.customerEmail,
      name: params.customerName,
      phonenumber: params.customerPhone,
    },
    payment_options: params.paymentMethod || "card,mobilemoney,bank_transfer,ussd",
    customizations: {
      title: "Amana Marketplace",
      description: `Order ${params.orderId}`,
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
    meta: {
      order_id: params.orderId,
    },
  });

  return data.data;
}

export async function verifyPayment(transactionId: string) {
  const data = await flutterwaveRequest(`/transactions/${transactionId}/verify`, "GET");
  return data.data;
}

export async function initiateMpesaPayment(params: {
  orderId: string;
  amount: number;
  phoneNumber: string;
  currency?: string;
}) {
  return initializePayment({
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency || "KES",
    customerEmail: "",
    customerName: "",
    customerPhone: params.phoneNumber,
    paymentMethod: "mobilemoney",
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}/confirm`,
  });
}

export async function initiateMomoPayment(params: {
  orderId: string;
  amount: number;
  phoneNumber: string;
  currency?: string;
}) {
  return initializePayment({
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency || "GHS",
    customerEmail: "",
    customerName: "",
    customerPhone: params.phoneNumber,
    paymentMethod: "mobilemoney",
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}/confirm`,
  });
}

// Webhook verification — Flutterwave sends verif-hash that matches your secret hash
export function verifyWebhookSignature(signature: string): boolean {
  const secretHash = process.env.FLW_SECRET_HASH || "";
  if (!secretHash) return false;
  return signature === secretHash;
}
